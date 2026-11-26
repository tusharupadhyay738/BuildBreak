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

`Arena` creates the bounded test definition from the contract. Kane authors the
browser recording on the first healthy run. Arena validates its local target,
allowed navigate/click/read actions, exact visible assertion and SHA-256, then
requires two distinct passes on fresh app copies before Gemini is called.
Gemini can propose only one JSON integer change to the declared field. The local
operator must approve that exact diff; rejection, timeout, or no response stops
the flow without applying a change.

The included [Museum Exhibit Price Card](../../examples/local-contract-museum/)
is a small third app, independent of BreakShop and SeatPilot. Completing its
offline mocked-agent run demonstrates only this versioned static-data contract.
It does not establish support for arbitrary projects. Unsupported uploads stay
inspection-only.
