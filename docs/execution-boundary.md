# Local execution boundary

Flask servers, direct probes and app-test subprocesses receive an allowlist of
OS path/home/locale variables plus fixed Python settings. Inherited API keys,
cloud credentials, custom secrets, Python search hooks and Flask configuration
are omitted. Their temporary directory is inside the isolated workspace.

Kane and Codex keep their inherited CLI setup so their authenticated sessions
can work. `GEMINI_API_KEY` and `GOOGLE_API_KEY` are removed for both CLI and app
roles. The parent process alone uses the Gemini key.

Before running a Builder repair, Arena compares syntax trees and rejects new
or changed imports/calls involving `os`, `subprocess`, `socket`, `urllib`,
`requests`, `eval`, `exec` or `__import__`, including imported aliases. Existing
trusted operations in the broken app must remain structurally unchanged if
retained. Route decorators remain protected too.

These checks reduce accidental exposure; they are not an operating-system
sandbox. Generated Python still runs with the current user's filesystem and
network rights. Do not treat arbitrary hostile repair code as safe because it
passes an AST check. Broader isolation and a complete Python security policy
are outside this local demonstration.
