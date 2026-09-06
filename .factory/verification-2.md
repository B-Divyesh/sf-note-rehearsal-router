# Verification 2 — Route Markdown notes into learning actions

**VERDICT: FAIL**

- Findings: **1** — 1 high
- Untested public claims: **1**
- Verification date: 2026-09-06
- Live URL: <https://note-rehearsal-router.sociobot.in/>
- Implementation candidate reviewed: `39050d351fb25a30a17fe5088944f1af50b5cb22`
- Documentation candidate reviewed: `872959f3e89013aff20eaf37f30ceb98d81f2586`

The implementation and deployment are otherwise verified, but this is not a
PASS. The public paid purchase action is live, advertised, and broken. A PASS
requires zero findings and zero untested claims.

## Job, audience, and first action before scrolling

Fresh desktop (1440 x 900) and phone (390 x 844) browser contexts both showed:

- Job: **Route Markdown notes into learning actions**.
- Audience: self-learners with saved Markdown notes.
- First action: **Try it with sample data**; it says that it opens four example
  notes in a separate demo.

Both contexts had one `h1`, one `main`, `lang="en"`, the expected route title,
and no horizontal overflow or console errors. This closes the first-screen
plain-words issue from review 1.

## Finding

### V2-1 — High — The advertised paid purchase path returns HTTP 404

The landing page, privacy policy, terms, README, and claim registry say that a
US $19 one-time license can be purchased through Sociobot / Dodo. The live
`Buy the one-time license` link targets the required product checkout endpoint,
but a fresh request on 2026-09-06 returned **HTTP 404** with JSON, rather than
a hosted checkout or redirect. The link crawler found every other product link
at HTTP 200.

This is a live user-path defect even though its cause is the separately owned
Sociobot billing registration. A visitor cannot make the advertised purchase.
The product-side URL, license capture, restore, verification, cached verdict,
and revocation behavior are present and covered by fixtures; those do not make
the unavailable live checkout usable.

The `checkout-boundary` command passed, but it only asserts the link target and
the absence of card inputs on the product page. It does not assert the promised
checkout result. Therefore the public assertion that Sociobot / Dodo *handles
checkout* is counted as one incomplete/untested claim as well as being false at
the live endpoint.

Required resolution: the billing operator must register or enable the
`note-rehearsal-router` production offer so the exact existing checkout URL
returns the hosted checkout. Retest the link and a transaction return flow
after that external change.

## Checks that passed

### Clean candidate and artifacts

A new clone was checked out at documentation SHA `872959f`; its only difference
from implementation SHA `39050d3` is `.factory/handoff.md`.

- `npm ci` passed: 231 packages installed; audit reported 0 vulnerabilities.
- `npm run typecheck` passed.
- `npm test` passed: 16 unit tests and 42 browser tests passed, with 22
  intentional project skips.
- `npm run build` passed and produced `dist/site/`,
  `dist/extension/chrome-mv3/`, and the downloadable ZIP.
- `unzip -t dist/site/downloads/note-rehearsal-router.zip` passed.
- All 20 commands declared in `.factory/claims.json` passed independently.
  Each claim tag occurs exactly once in `tests/e2e/claims.spec.ts`.
- The first focused command immediately after the full suite briefly found port
  4173 still reserved; its clean retry and all subsequent focused commands
  passed. This was not reproducible across the other 19 commands.
- Build output remains within the static budget: landing JS is 1.17 KB before
  gzip; the extension bundle is 127.65 KB including its self-hosted fonts.

### Live deployment

- SHA-256 of live `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` exactly
  matches the clean candidate build.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, `robots.txt`, `sitemap.xml`,
  and the extension ZIP return HTTP 200. An unknown URL returns the designed
  document with HTTP 404. The browser's single 404 resource console message is
  expected for that deliberate response; the page itself has correct structure
  and no functional error.
- All public pages have their own title, one `h1`, header navigation, `main`,
  footer, canonical metadata, and the expected social metadata.
- The live CSP is a response header and includes `frame-ancestors 'none'`;
  `nosniff`, HSTS, strict-origin referrer policy, and restrictive permissions
  policy are also present.
- Playwright axe found **zero violations** on home, demo, privacy, terms, and
  the live 404 page.
- Normal live loading and the complete demo flow requested only the product
  origin. No analytics, advertising, tracker, or remote-font request appeared.

### Demo sandbox and interaction

From a fresh phone context, I opened the first-screen sample link, seeded a
separate real-data key before entering, and used keyboard key `2`:

- `/demo/` showed the persistent **Demo — sample data, nothing is saved** label,
  four realistic notes, one pre-existing ledger entry, and the current note
  “Estimate before calculating.”
- The keyboard route created a visible, realistic `solve` Markdown ticket with
  source, status, rehearsal prompt, and completion checkbox, then advanced to
  “Cache invalidation has two clocks.”
- **Reset demo** restored the initial note and one ledger entry. It left the
  seeded real-data key unchanged; the demo used its separate `demo:` storage
  key.

The automated clean suite additionally covers empty and oversized notes,
duplicate ticket names, failed writes, permissions, queue completion, free
limit, undo, export, invalid and revoked license states, offline free use,
keyboard routing, reduced motion, 200% text at phone width, focus handling,
and the packaged MV3 extension's browser-owned disposable folder flow. That
installed artifact flow writes one `.rehearsal` ticket and verifies that the
source bytes are unchanged. Native OS directory-picker approval still requires
a real user gesture, which is a browser automation limit rather than an
uncovered product claim.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| R1: missing demo sandbox | Fixed and live-verified. |
| R2: checkout 404 | Still open as V2-1. |
| R3: missing claim registry and tests | Registry has 20 entries and all commands pass; checkout result remains inadequately tested. |
| R4: missing designed 404 | Fixed; unknown route returns designed HTTP 404. |
| R5: plain-words copy | Fixed; required first-screen information is visible and copy audit is present. |
| R6: metadata and standard structure | Fixed and live-verified. |
| R7: resize, touch, and text issues | Fixed by clean mobile, keyboard, reduced-motion, and 200% resize coverage. |
| R8: missing CSP | Fixed; live header policy is present. |
| R9: vulnerable `fflate` | Fixed; current clean audit reports 0 vulnerabilities. |
| R10: reset status announcement | Fixed by the reset outcome test. |
| Previous verifier's CSP hardening note | Closed by the live response header. |

## Scope

This is a static landing site and MV3 browser extension. Backend tenant
isolation, restart persistence, health, and HTTP 429/`Retry-After` checks do
not apply. The brief explicitly excludes AI summaries and cloud sync; no
missing AI capability is a finding.

No product code, billing configuration, infrastructure, secrets, or another
product was changed during verification.
