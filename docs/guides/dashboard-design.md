# Dashboard design integration

The light console presentation adapts the user's Google AI Studio ZIP design
to the existing Flask/Jinja views. Its sample history, sample screenshot images,
environment templates, build scripts and sound effects were not imported.
There is no new frontend build step, external font request or API dependency.

Run `python app.py` and open `/arena`. Search and state filters narrow the ten
most recent history rows; selecting a row opens its own recorded verification.
Filters do not change the selected battle or the measurement denominators.
The existing three-second polling preserves filters and open disclosures and
keeps the last rendered records if refresh fails. Edits to search controls are
not interrupted by polling. Full-image links use the existing hash-bound image
endpoint; raw evidence remains private.

Empty workspaces link to the genuine November 17 recorded report on GitHub.
That link requires internet access and does not seed the local database.
This is a read-only console: it does not launch battles, fix code, expose keys
or export raw logs. Screenshots are recorded viewports, not a live stream.

The protected checkout test, runner, independent checks and main shop source
were not changed for this redesign. Dashboard source is included in battle
snapshot bindings, so a cache bound to an older dashboard snapshot can be
rejected. Generate/revalidate a new cache through the normal workflow; do not
rewrite cache hashes to bypass the binding.

This UI adaptation does not constitute a new live Kane verification.
