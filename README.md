# Copy the JD

Copy the **selected LinkedIn job**, not the whole search page.

A small, local-only userscript and bookmarklet for desktop Firefox, Chrome and Edge. Includes the job title, company, location when available, a clean job link and the loaded description, with paragraphs and list markers preserved.

No AI service, API key, tracking, runtime dependencies or uploads. Not affiliated with or endorsed by LinkedIn.

## Install the persistent button

1. Install **Tampermonkey** from your browser's official extension store.
2. Open its dashboard and select **Create a new script**.
3. Open [`linkedin-copy-jd.user.js`](linkedin-copy-jd.user.js), select **Raw**, and copy the entire file into the new script, replacing the template. Save it.
4. Allow the manager to run on LinkedIn. Chrome/Edge versions with **Allow User Scripts** require that switch for the manager; older versions may require Developer mode. Follow the manager's instructions and your organisation's policy.
5. Reload LinkedIn and select a job. Click **Copy the JD** at bottom-right, then paste wherever you need the description.

Install separately in each browser. Matching includes other LinkedIn pages so moving from Feed to Jobs works without reloading; the button is shown only on Jobs pages.

## Use the bookmarklet instead

No userscript manager needed:

1. Download and extract the ZIP from this repository's **Releases** section, or use **Code > Download ZIP**.
2. Open `install.html` locally in your browser.
3. Drag its blue **Copy the JD** link onto your bookmarks bar.
4. Open a LinkedIn job and click that bookmark.

Alternatively, create a bookmark and paste the complete single line from [`bookmarklet.txt`](bookmarklet.txt) into its **URL/Location** field. Do not paste it into the address bar, where browsers may strip `javascript:`. The bookmarklet is self-contained; browser or site security policy can still block it.

The bookmarklet leaves a button on the current page after its first invocation. Click the bookmark again after a full reload. The userscript starts automatically instead.

## What gets copied

```text
# Job title

Company: Company name

Location: Location, when identifiable

URL: https://www.linkedin.com/jobs/view/<job-id>/

## Job description

Description paragraphs and bullet points...
```

The current detail pane is identified using its structural job ID, with bounded fallbacks for legacy layouts. Tracking parameters are removed from the copied link. Search cards, premium prompts, recruiter profiles and the separate company panel are excluded.

Text already loaded but visually clamped behind “more” is included. Text the site has not loaded cannot be recovered: expand the description manually and retry if needed. Unknown or ambiguous layouts produce an error rather than a whole-page copy. Company or location metadata that cannot be identified is omitted, not guessed.

## Privacy and clipboard behavior

The script makes **no network requests**, stores nothing and never reads existing clipboard contents. It does not click Apply, Save, Follow or Message. Clicking **Copy the JD** replaces the clipboard with the selected job.

The userscript prefers the manager's clipboard-write API, then the browser API. If those fail, it tries the legacy copy command. If all automatic methods fail, a read-only box opens with the complete JD selected: press **Ctrl+C** (Mac: **Command+C**) and close it.

The userscript manager is a separate extension with its own permissions and privacy policy. Install software only where your device policy permits it. This tool is for individually copying descriptions you can already view, not automated bulk collection.

## Compatibility and limits

| Browser | Evidence |
|---|---|
| Edge | Native browser checks passed |
| Firefox | Native browser checks passed |
| Chrome | Compatible syntax/Chromium target; not independently run for this release |

See [VERIFICATION.md](VERIFICATION.md) for test scope. Installing through a userscript manager is a separate acceptance check; the exact generated scripts were browser-tested without installing a manager.

- Modern job IDs are compared to the selected URL and title link. Mismatches block copying while another job loads.
- Legacy layouts without a description ID cannot provide the same complete stale-state check. Open the job in its own tab if uncertain.
- The structural selectors can work across UI languages; the semantic-heading fallback recognises English only.
- LinkedIn markup can change. Report a failing layout with **synthetic/redacted HTML**, not private account screenshots or credentials.
- Inline-hidden UI is excluded. Generic class-hidden content is not removed because that could discard collapsed description text.

## Development

Requires Node.js 22.12+ and npm. Installed dependencies are build/test-only, never downloaded by the userscript or bookmarklet.

```sh
npm ci
npm test
npm run build
```

- `copy-jd.js`: shared implementation.
- `tools/build.cjs`: generates both distributions and `install.html`.
- `tools/regression.cjs`: 19 DOM/clipboard-path checks using synthetic fixtures.
- `evidence/`: ignored local build/test output.

The generated files are committed so installation requires no build step. Changes to the source should be followed by tests and regeneration of both distributions.

## Licence

[MIT License](LICENSE). Copyright (c) 2026 Shaik Akbar. Use, modify and redistribute the software, including commercially, provided the copyright and permission notice are retained. The software is provided without warranty.

`private: true` in package.json prevents accidental npm publishing; the GitHub repository is public.
