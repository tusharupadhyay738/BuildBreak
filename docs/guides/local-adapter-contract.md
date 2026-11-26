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

Live judge execution is currently disabled. The installed Kane CLI help shows
that `testmd run` runs an existing `*_test.md` and `--author` reauthors that
existing test; `design tests` requires an existing use-case. It does not
document a noninteractive command that creates a local browser-test definition
from a healthy app without a manual test-review step. Arena therefore refuses
to start the live workflow and does not substitute an adapter-authored test.

Offline mocked-agent fixtures exercise the remaining gates using synthetic,
adapter-supplied test definitions. They do not prove Kane-authored test
creation or live execution. They cover Arena validation of the local target,
permitted actions, assertion and SHA-256, two passes on fresh app copies,
explicit operator approval, and up to three Arena-checked Codex attempts with
Kane reverification. Rejection or timeout applies no fault. Persistent history
stores stages, verdicts and validated Kane/evidence references only, not source,
diffs, raw evidence or private paths. These fixture results are synthetic.

The included [Museum Exhibit Price Card](../../examples/local-contract-museum/)
is a small third app, independent of BreakShop and SeatPilot. Completing its
offline mocked-agent run demonstrates only this versioned static-data contract.
It does not establish support for arbitrary projects. Unsupported uploads stay
inspection-only.
