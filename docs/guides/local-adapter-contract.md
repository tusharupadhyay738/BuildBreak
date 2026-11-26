# LOCAL adapter contract

The `LOCAL` adapter is a deliberately narrow option for a developer-owned,
static app. It is not support for arbitrary project archives, frameworks, or
server code. A project must provide:

- `arena.json`, contract version `1`;
- `site/index.html` and every listed static asset;
- one listed JSON data file with a root-level, nonnegative integer field;
- an exact visible numeric result and element IDs for a single optional click.

The adapter copies only the declared static assets and contract into a private
snapshot. It does not install dependencies, run project scripts, start an
imported server, or execute imported source on the host. A trusted local server
serves the static files and one controlled JSON field. Browser requests are
restricted to that server; external network access is blocked.

The LOCAL judge button is available when local execution and all required CLIs
are configured. Kane ingests Arena's bounded requirements note, extracts one
use-case and designs one browser test. Arena rejects a missing exact assertion
or optional required click. It binds the start URL in disposable test copies,
preserves the Kane-authored source hash, and requires two healthy Kane passes
whose traces show navigation, the click and the expected assertion. A failure
stops before fault injection. The user reviews the Gemini fault, not the test.

Offline mocked-agent fixtures exercise the remaining gates using synthetic
test definitions. They do not prove a complete live battle. They cover Arena validation of the local target,
permitted actions, assertion and SHA-256, two passes on fresh app copies,
explicit operator approval, and up to three Arena-checked Codex attempts with
Kane reverification. Rejection or timeout applies no fault. Persistent history
stores stages, verdicts and validated Kane/evidence references only, not source,
diffs, raw evidence or private paths. These fixture results are synthetic.

The included [Museum Exhibit Price Card](../../examples/local-contract-museum/)
is a small third app, independent of BreakShop and SeatPilot. Kane designed a
test that [passed twice on healthy copies](../evidence/museum-generated-healthy.md).
No live Gemini fault or Codex repair has run through this judge route yet. The
adapter does not establish support for arbitrary projects; unsupported uploads
stay inspection-only.
