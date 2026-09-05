# Handoff — Note Rehearsal Router v1

## Review 1 status: FAIL

Reviewer work order: `note-rehearsal-router-review-1`
Review date: 2026-09-05
Implementation candidate: `27faed6ab37db8ab3e28cacd83bb7934b3b9590c`
Documentation candidate reviewed: `88e200b6b93568e900dfa7faad90f5e67fa95473`

Strict review found 10 findings and 20 untested public claim groups. The main
release blockers are the missing one-click isolated sample, absent claims
registry and tagged claim tests, and the live US $19 checkout URL returning
HTTP 404. The required 404 page is also absent. Plain-word copy, metadata/page
structure, text resize and target sizes, CSP, one build dependency, and reset
announcement behavior need correction.

Clean `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` completed.
The live extracted extension matches the candidate and its core routing logic
worked with a disposable injected folder. Lighthouse mobile scored 100 in all
four categories. These passing checks do not override the failed contract
checks. Full evidence and exact remediation targets are in
`.factory/review-1.md`.

## Prior independent verification status (2026-08-28): PASS under the earlier contract

Verifier work order: `note-rehearsal-router-verify-1`
Tested candidate: `322e05cdf46701051ea646feb0eef6d5a6c0eafa`
Live URL: <https://note-rehearsal-router.sociobot.in/>

Fresh verification completed from a clean install. `npm run typecheck`,
`npm test` (10 unit tests and 10 Playwright tests; 2 intentional skips),
`npm run build`, package integrity, accessibility checks, desktop/390 px
browser checks, keyboard focus, reduced motion, privacy/outbound-request
review, response-header/cache checks, and live artifact comparison passed.
The deployed HTML, JS, CSS, hero assets, fonts, and unpacked extension files
match the candidate; the downloadable ZIP differs only in archive timestamps.

No blocker, critical, high, or medium defects were found. One low-severity
hardening follow-up remains: add a Content-Security-Policy header to the static
site. Full exact evidence and verification limitations are in
`.factory/verification.md`.

Date: 2026-08-28

Work order: `note-rehearsal-router-build-1`

Artifact: WXT + TypeScript Chrome MV3 extension, with a Vite static product site

## What shipped

- A full-tab extension desk opened from the toolbar action. It recursively scans a user-selected local directory for Markdown, presents one unrouted note, and creates exactly one separate `recall`, `solve`, `teach`, `do`, or `archive` Markdown ticket under `.rehearsal/`.
- Source Markdown is read-only. A route is added to the local ledger only after the ticket write succeeds; failed writes leave the note available. Duplicate filenames receive a numeric suffix.
- Folder handles persist in IndexedDB, while the versioned route ledger and preferences use `chrome.storage.local`. Permission-expired, empty-folder, completed-queue, free-limit, loading, scan/write error, and offline-license states have recovery actions.
- Keyboard routes `1`–`5`, `R` to rescan, `E` to export, visible focus, live announcements, reversible last-route deletion, and a 390 px layout.
- Folder monitoring is browser-safe: scan on open, manual rescan, and automatic rescan when the desk regains focus after editing elsewhere. No unstable filesystem observer or background page access is used.
- Free tier: 30 routed notes, local ticket writing, undo, and Markdown ledger export. US $19 one-time unlock: unlimited routing and a custom ticket-folder name. Checkout/verification uses the Sociobot API with no hard-coded product ID, cached daily verification, offline optimistic behavior for a previously valid license, return-token capture, and paste-to-restore.
- Static landing page with the original routing-field visual system, direct packaged ZIP download, responsive AVIF/WebP/JPEG hero, product explanation, install steps, purchase flow, `/privacy/`, `/terms/`, `robots.txt`, `sitemap.xml`, and static-host caching/security headers.
- Original generated hero plus hand-authored route icon. Prompt, model route, date, review, and license provenance are recorded in `.factory/design.md` and `assets/src/routing-field*.json`.

## Build outputs

Run `npm run build` or `npm run build:site` from a clean install. Both create the complete release:

- Static deploy root: `dist/site/` (contains root `index.html`)
- Extension: `dist/extension/chrome-mv3/`
- Linked archive: `dist/site/downloads/note-rehearsal-router.zip` (104 KB in this build)

## Verification

- `npm run typecheck` — pass.
- `npm test` — pass: 10 Vitest domain/filesystem tests; production build; 10 Playwright desktop/mobile/extension tests passed with 2 intentional cross-project skips.
- Playwright launches the built MV3 extension in Chromium and checks title, single h1, onboarding, 390 px overflow, console errors, and axe serious/critical violations.
- Landing/site Playwright coverage checks desktop and mobile layouts, download path, license-return storage and URL stripping, legal routes, semantic landmarks, and axe serious/critical violations.
- `npm audit` — 0 vulnerabilities.
- Bundle budgets: extension initial JS 20.76 KB; extension CSS 11.23 KB; two Latin variable fonts 86.05 KB total. Landing mobile transfer measured by Lighthouse: 112 KiB. Hero variants are 19–54 KB.
- Lighthouse 12.8.2, mobile preset, local production preview: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.4 s, LCP 1.7 s, CLS 0.015, TBT 0 ms, Speed Index 1.4 s.
- Manual visual review completed at 1280 px and 390 px. Generated art has no pseudo-text, people, brands, watermarks, or broken route geometry.

## Privacy and uninstall

The manifest requests only `storage`; it has no content scripts or page-reading/host permissions. Notes, paths, and route history are not transmitted. Only a license token reaches the billing verification endpoint. “Forget local data” clears browser-held folder/ledger data without deleting disk tickets; uninstalling clears extension storage. Export remains available in the free tier.

## Known gaps / release steps

- The factory still needs to register the production paid product/return URL and publish the extension. The code intentionally uses the slug-based production API contract and contains no generated product ID.
- The downloadable ZIP is for Chrome’s “Load unpacked” developer flow until a signed store package is produced. The landing page explains that flow.
- Chromium’s File System Access API is required, so Firefox and Safari are not supported in v1. Folder access may need a user click to reconnect after browser restarts; this is a browser security requirement.
- No real payment was attempted in this build. Return capture, verification response handling, cache behavior, and paste restore were tested with an intercepted API response.
