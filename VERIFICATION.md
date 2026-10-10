# Verification

Release 1.0.0, 10 October 2026.

## Completed checks

- **19/19 DOM regressions**: modern and legacy extraction; semantic-heading fallback; metadata; company-panel exclusion; mismatching job IDs; missing/ambiguous descriptions; lookalike domains; root loading state; nested lists; hidden nodes/list items; collapsed description text; refusal to use unrelated result titles; manager/native/legacy/manual clipboard paths; Escape dismissal; no clipboard call on invalid extraction.
- **8/8 native Edge checks** (155.0.4283.45): exact generated userscript/bookmarklet execution, real button/link clicks, singleton behavior, stale selection rejection, in-page job changes, button remount, denied-clipboard UI and installer link equality.
- **4/4 native Firefox checks** (140.17.0): exact generated scripts, selected-job text and bullets, repeated execution, manual fallback and encoded bookmarklet link execution.
- **Live LinkedIn**: verified complete loaded description against its DOM, correct metadata and canonical URL, exclusion of surrounding panels, and a real switch between two selected jobs.
- **Real clipboard**: copied text matched generated text after Windows CRLF-to-LF normalisation. No unrelated clipboard contents recorded.
- **Mutation check**: removing identity guards in an in-memory source copy made the stale-job regression fail, as intended.
- Inspected the button and manual-copy UI in native browsers and on the live site, plus the installation page.

The native browser tests used isolated temporary profiles, synthetic LinkedIn responses and stubbed clipboard APIs. The separate live check used an actual clipboard. Manager APIs were simulated in DOM tests.

## Not claimed

- Chrome was not installed for an independent native run. Edge provides Chromium-engine evidence, not a Chrome installation test.
- No userscript manager was installed as part of the checks. Manager-specific installation and permissions remain acceptance checks.
- Encoded bookmarklets were tested by actual link clicks in native browsers. Real bookmark-bar installation and site-specific content-security policy can differ.
- Legacy/localised layouts have synthetic coverage only. Future LinkedIn markup changes may require updates.
- UI syntax targets Chrome/Edge 109+ and Firefox 115+; that is not a claim of testing every supported version.

## Reproduce included tests

```sh
npm ci
npm test
npm run build
```

Only synthetic fixtures are included in this repository. Signed-in screenshots, real job captures, local paths, clipboard evidence and session logs are deliberately excluded.
