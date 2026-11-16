# SAMPLE REPORT: sanitized historical drills

This is a reading example assembled from already documented genuine results,
not a new execution, live agent activity, or a sample inserted into the database.
A fresh installation remains empty. Raw evidence is private and is not included.

Sources: [first live Gemini drill](gemini-first-battle.md) and
[verified cached replay](cached-replay.md). Values and identifiers below come
only from those accounts.

## Live-generated drill

Battle `20261114T181556-024e132e`, November 14, 2026.
Breaker: Gemini `gemini-3.5-flash-lite`, first proposal accepted, no fallback.
The generated change increased SAVE10 from 10% to 15%.

| Phase | Kane execution identifier | Recorded result |
| --- | --- | --- |
| Healthy | `ac900d92-96a2-47e3-88b0-6e35b7187f91` | Passed |
| Faulted | `0af5d894-7553-4af8-b727-d3d727ee7741` | Failed |
| Repaired | `90318872-8e97-4fd1-9c8e-0a40ef183447` | Passed |

Expected subtotal / discount / total: **$44.97 / $4.50 / $40.47**.
The separate direct database check found **$44.97 / $6.75 / $38.22**.
Kane observed the wrong **$6.75** discount and stopped before checkout; it did
not create the wrong saved order. Codex repaired on attempt one, followed by
11 passing isolated app/dashboard tests, a passing direct check and Kane's
passing checkout/confirmation reload. Outcome: caught and repaired.

## Cached replay

Battle `20261115T051420-5ba874b2`, November 15, 2026.
Breaker source: replay of that same validated Gemini fault, with no Gemini API
call during replay. Kane and Codex still used their authenticated services.

| Phase | Kane execution identifier | Recorded result |
| --- | --- | --- |
| Healthy | `452da195-dbf2-4b69-b186-4869fec0d74f` | Passed |
| Faulted | `3bb786e9-4dce-4cfe-a473-603b6502714d` | Failed |
| Repaired | `a60b4704-7ca6-445e-9b4f-a2b92d0af544` | Passed |

The expected and directly observed faulted amounts were the same as above.
Kane again stopped at the discount assertion before checkout. Codex repaired
on attempt one; 11 isolated tests, the direct check and Kane's unchanged
checkout/reload test passed. Outcome: caught and repaired.

## Interpretation

These accounts demonstrate a generated pricing drill and its cached replay,
not distinct bug discoveries or a statistical repair rate. Earlier incomplete
and baseline-blocked attempts remain unscored, as documented in the replay
account. No quantity escape or requirements-only ablation result is claimed.
