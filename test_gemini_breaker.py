"""Offline contract tests. Mock responses are not genuine Gemini executions."""
import io
import json
import os
from pathlib import Path
import ssl
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

from contextlib import redirect_stdout
from gemini_breaker import configuration, propose_fault, GeminiError, diagnose
from process_control import child_environment


class GeminiTests(unittest.TestCase):
    def environment(self):
        return patch.dict(os.environ, {'GEMINI_API_KEY': 'unit-test-placeholder',
                          'GEMINI_MODEL': 'gemini-test',
                          'ARENA_GEMINI_FREE_TIER_CONFIRMED': '1'}, clear=True)

    def test_configuration_requires_key_model_and_explicit_free_tier_confirmation(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(GeminiError):
                configuration()
        with self.environment():
            self.assertEqual(configuration(), ('unit-test-placeholder', 'gemini-test'))
            for name, value in [('GEMINI_MODEL', '../bad'), ('ARENA_GEMINI_FREE_TIER_CONFIRMED', '0')]:
                with patch.dict(os.environ, {name: value}):
                    with self.assertRaises(GeminiError):
                        configuration()

    def test_structured_request_has_header_key_and_no_tools(self):
        proposal = {'file': 'app.py', 'old_text': 'a', 'new_text': 'b', 'description': 'fixture'}
        response = {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [
            {'text': 'private thought', 'thought': True}, {'text': json.dumps(proposal)}]}}]}
        with self.environment(), patch('gemini_breaker.urllib.request.urlopen',
                                      return_value=io.BytesIO(json.dumps(response).encode())) as fetch:
            self.assertEqual(propose_fault('fixture source'), proposal)
        request = fetch.call_args.args[0]
        self.assertNotIn('unit-test-placeholder', request.full_url)
        self.assertEqual(request.get_header('X-goog-api-key'), 'unit-test-placeholder')
        body = json.loads(request.data)
        self.assertNotIn('tools', body)
        self.assertEqual(body['generationConfig']['responseMimeType'], 'application/json')
        self.assertFalse(body['generationConfig']['responseJsonSchema']['additionalProperties'])

    def test_http_errors_never_expose_provider_body_or_key(self):
        error = urllib.error.HTTPError('https://example.invalid', 429, 'private-response', {}, None)
        with self.environment(), patch('gemini_breaker.urllib.request.urlopen', side_effect=error):
            with self.assertRaises(GeminiError) as caught:
                propose_fault('fixture')
        self.assertIn('429', str(caught.exception))
        self.assertNotIn('private-response', str(caught.exception))
        self.assertNotIn('unit-test-placeholder', str(caught.exception))

    def test_malformed_incomplete_and_oversized_responses_are_rejected(self):
        for response in (b'not JSON', b'{"candidates": []}',
                         b'{"candidates": [{"finishReason": "MAX_TOKENS"}]}', b'x' * 1000001):
            with self.subTest(size=len(response)), self.environment(), \
                    patch('gemini_breaker.urllib.request.urlopen', return_value=io.BytesIO(response)):
                with self.assertRaises(GeminiError):
                    propose_fault('fixture')

    def test_breaker_keys_are_removed_from_child_environment(self):
        with self.environment(), patch.dict(os.environ, {'GOOGLE_API_KEY': 'another-placeholder', 'PATH': 'keep'}):
            environment = child_environment()
        self.assertNotIn('GEMINI_API_KEY', environment)
        self.assertNotIn('GOOGLE_API_KEY', environment)
        self.assertEqual(environment['PATH'], 'keep')

    def test_timeout_and_tls_failures_are_distinct_and_sanitized(self):
        failures = [(TimeoutError('secret detail'), 'timeout'),
                    (urllib.error.URLError(TimeoutError('secret detail')), 'timeout'),
                    (urllib.error.URLError(ssl.SSLCertVerificationError(1, 'secret detail')), 'tls_error'),
                    (urllib.error.URLError('secret detail'), 'connection_error')]
        for failure, kind in failures:
            with self.subTest(kind=kind), self.environment(), \
                    patch('gemini_breaker.urllib.request.urlopen', side_effect=failure):
                with self.assertRaises(GeminiError) as caught:
                    propose_fault('fixture')
                self.assertEqual(caught.exception.kind, kind)
                self.assertNotIn('secret detail', str(caught.exception))

    def test_http_errors_identify_transient_and_permanent_failures(self):
        for status, retryable in [(503, True), (429, True), (403, False), (400, False), (404, False)]:
            error = urllib.error.HTTPError('https://example.invalid', status, 'private', {}, None)
            with self.subTest(status=status), self.environment(), \
                    patch('gemini_breaker.urllib.request.urlopen', side_effect=error):
                with self.assertRaises(GeminiError) as caught:
                    propose_fault('fixture')
                self.assertEqual(caught.exception.status, status)
                self.assertEqual(caught.exception.retryable, retryable)

    def test_token_exhaustion_is_not_reported_as_network_failure(self):
        response = {'candidates': [{'finishReason': 'MAX_TOKENS'}]}
        with self.environment(), patch('gemini_breaker.urllib.request.urlopen',
                                      return_value=io.BytesIO(json.dumps(response).encode())):
            with self.assertRaises(GeminiError) as caught:
                propose_fault('fixture')
            self.assertEqual(caught.exception.kind, 'token_limit')

    def test_envelope_json_and_candidate_json_failures_are_distinct(self):
        responses = [(b'not json', 'invalid_response_json'),
                     (b'[]', 'invalid_response_shape'),
                     (json.dumps({'candidates': [{'finishReason': 'STOP', 'content': {'parts': [
                         {'text': 'not json'}]}}]}).encode(), 'invalid_candidate_json')]
        for response, kind in responses:
            with self.environment(), patch('gemini_breaker.urllib.request.urlopen', return_value=io.BytesIO(response)):
                with self.assertRaises(GeminiError) as caught:
                    propose_fault('fixture')
                self.assertEqual(caught.exception.kind, kind)

    def test_diagnostic_makes_one_small_request_and_saves_no_key_or_source(self):
        response = {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': '{"status":"ok"}'}]}}]}
        with tempfile.TemporaryDirectory(dir='.') as folder, self.environment(), \
                patch('gemini_breaker.__file__', str(Path(folder).resolve() / 'gemini_breaker.py')), \
                patch('gemini_breaker.urllib.request.urlopen', return_value=io.BytesIO(json.dumps(response).encode())) as fetch, \
                redirect_stdout(io.StringIO()) as output:
            self.assertEqual(diagnose(), 0)
            files = list(Path(folder).glob('instance/gemini-diagnostics/*/result.json'))
            self.assertEqual(len(files), 1)
            saved = files[0].read_text(encoding='utf-8')
            self.assertTrue(json.loads(saved)['passed'])
            self.assertNotIn('unit-test-placeholder', saved + output.getvalue())
            self.assertNotIn('APP:', fetch.call_args.args[0].data.decode())
            self.assertEqual(fetch.call_count, 1)

    def test_diagnostic_failure_saves_safe_category_without_retrying(self):
        with tempfile.TemporaryDirectory(dir='.') as folder, self.environment(), \
                patch('gemini_breaker.__file__', str(Path(folder).resolve() / 'gemini_breaker.py')), \
                patch('gemini_breaker.urllib.request.urlopen', side_effect=TimeoutError('private')) as fetch, \
                redirect_stdout(io.StringIO()) as output:
            self.assertEqual(diagnose(), 1)
            self.assertEqual(json.loads(output.getvalue())['kind'], 'timeout')
            self.assertNotIn('private', output.getvalue())
            self.assertEqual(fetch.call_count, 1)


if __name__ == '__main__':
    unittest.main()
