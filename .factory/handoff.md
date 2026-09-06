# Handoff — Note Rehearsal Router repair 1

Date: 2026-09-06

Work order: `note-rehearsal-router-repair-1`

Version: 1.1.0

Implementation and deployed SHA: `39050d351fb25a30a17fe5088944f1af50b5cb22`

Live URL: <https://note-rehearsal-router.sociobot.in/>

## Outcome

The product-owned repair is complete and deployed. The extension still performs the original local Markdown routing job. The landing now states the job, audience, first action, privacy, free limit, and price before scrolling on desktop and a 390 px phone.

The only remaining release dependency is outside this repository: the Sociobot billing operator must register or enable the advertised one-time offer. The live checkout endpoint still returns HTTP 404 with `enabled factory product`. License verification is reachable and returns a structured invalid verdict for a bad token. The product retains the US $19 paid deliverables, the exact production checkout link, license storage and verification, restore, revocation handling, and legal terms. Public registration metadata is in `/work/.evidence/billing-offer.json`; it contains no credential.

## Repair disposition

1. **One-click demo — fixed.** `/demo/` starts with four realistic notes and a populated ledger. The persistent banner says “Demo — sample data, nothing is saved” and provides Reset demo and Start for real. State uses only `demo:note-rehearsal-router:state`; reset and exit leave a seeded non-demo key unchanged.
2. **Checkout 404 — product side complete; external registration pending.** The exact slug-based checkout and US $19 one-time offer remain public. Valid, revoked, cached, paste-to-restore, and return-token flows have outcome tests. Registration metadata was supplied for the separate billing operator.
3. **Claims — fixed.** `.factory/claims.json` lists 20 public claim groups. Each ID appears in exactly one tagged outcome test, and every declared command passed independently from a fresh clone.
4. **404 — fixed.** Unknown live paths return HTTP 404 with the designed product page, one h1, route-specific title, navigation, and standard footer.
5. **Copy — fixed.** The h1 names the job. Audience and first action are explicit. Mood headings and metaphors were removed. `.factory/copy-audit.md` records every landing sentence and confirms the 22-word and banned-word checks.
6. **Metadata and structure — fixed.** Home, demo, privacy, terms, and 404 have distinct titles, one h1, standard landmarks, consistent navigation/footer, canonical and social metadata, a 1200×630 original social card, and an Apple touch icon. Sitemap and robots include the public routes.
7. **Accessibility and resize — fixed.** Site and extension text is at least 16 px, controls are at least 44 px, focus is visible, the settings dialog traps and restores focus, reduced motion is respected, and 200% text fits at phone width. Live axe found no violations on every public route, including 404.
8. **CSP — fixed.** A response-header CSP limits scripts, styles, images, fonts, forms, and connections; `frame-ancestors` is header-only. The live browser produced no CSP or console errors.
9. **Dependency finding — fixed.** `fflate` is 0.8.3 and `npm audit` reports zero vulnerabilities.
10. **Reset announcement — fixed.** Forget local data announces that browser data was cleared and disk tickets were not changed. Its test verifies extension storage and the folder handle are removed while an existing ticket remains.

The earlier low-severity CSP hardening item in `.factory/verification.md` is also closed. The working routing, file-write, undo, export, free-limit, offline, keyboard, and license behavior from earlier verification remains covered.

## What changed

- Added the isolated sample application, shared realistic fixtures, reset/exit behavior, keyboard routes, undo, ledger export, and `.factory/demo.md`.
- Added a 20-entry claims registry and outcome coverage for normal, invalid, boundary, privacy, offline, and recovery paths.
- Added installed-extension end-to-end coverage using a browser-owned disposable directory. It scans a sample Markdown file, routes it through the real UI, writes one `.rehearsal` ticket, and proves the source bytes are unchanged.
- Added unit coverage for empty and oversized notes, duplicate ticket names, failed writes, license capture, invalid verdicts, and cached offline verification.
- Reworked the landing and legal pages to the required site skeleton and plain language while preserving the routing-field visual identity.
- Added the designed 404, security headers, route metadata, social image, touch icon, and long-lived asset caching.
- Improved the extension settings dialog, invalid-license notice, reset status, text size, touch targets, and installed onboarding link to the demo.
- Updated the extension/package version and packaged ZIP to 1.1.0.

## Clean verification

A fresh local clone of the implementation SHA was used, not the working checkout.

- `npm ci` — pass; 231 packages installed; 0 vulnerabilities.
- `npm run typecheck` — pass.
- `npm test` — pass: 16 unit tests; production build; 42 browser tests passed with 22 intentional desktop/mobile or extension project skips.
- `npm run build` — pass; produced `dist/site/`, `dist/extension/chrome-mv3/`, and `dist/site/downloads/note-rehearsal-router.zip`.
- Every one of the 20 commands in `.factory/claims.json` — pass independently. Output: `/work/.evidence/claims-all.log`.
- Local Lighthouse mobile — 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.7 s, CLS 0, TBT 0 ms.

Build sizes remain inside the contract: extension JS 21.55 KB, CSS 11.50 KB, two self-hosted fonts 86.05 KB total, and the complete unpacked extension 127.65 KB. Landing JS is 1.17 KB and demo JS is 7.58 KB before gzip.

## Cold live verification

- Product-scoped deployment to existing `sf-note-rehearsal-router` completed without DNS, shared infrastructure, or replica changes.
- `/`, `/demo/`, `/privacy/`, `/terms/`, extension ZIP, `robots.txt`, and `sitemap.xml` return 200.
- A random unknown route returns HTTP 404 and the designed 404 document.
- The factory `verify-url.sh` reports title, `lang=en`, one h1, main landmark, complete alt text, no unlabeled buttons, and no console errors. Evidence: `/work/.evidence/verify-live/`.
- Fresh desktop and phone contexts confirmed the first-screen copy, one-click demo entry, populated output, persistent banner, route result, reset, exit, zero horizontal overflow, and no real-data mutation. Evidence: `/work/.evidence/live-browser-audit.json` and `live-demo-*.png`.
- Live axe: zero violations on home, demo, privacy, terms, and 404. Evidence: `/work/.evidence/live-axe.json`.
- Live Lighthouse mobile — 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.4 s, CLS 0, TBT 0 ms. Evidence: `/work/.evidence/lighthouse-live.json`.
- Invalid live license return strips the token from the URL, stores it under the product key, opens the dialog, and gives a recovery message without console errors. Evidence: `/work/.evidence/live-license-recovery.json`.
- Live checkout was retested after deployment and remains the named external 404 dependency. Evidence: `/work/.evidence/live-checkout-body.json`.

## Build and verification commands

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:claims -- --grep @claim:demo-sandbox
```

Use the `test` command listed on each entry in `.factory/claims.json` to run one public claim. The clean production outputs are:

- `dist/site/` — static deployment root
- `dist/extension/chrome-mv3/` — unpacked Chrome MV3 extension
- `dist/site/downloads/note-rehearsal-router.zip` — linked extension archive

## Honest limitations and next steps

- The billing operator must register or enable the production offer before checkout can accept a purchase. No fake checkout or entitlement was added.
- No paid transaction was attempted while checkout returned 404. Recorded valid and revoked responses test entitlement behavior; the live invalid-token endpoint was also exercised.
- Automated File System Access coverage replaces the native OS picker with a browser-owned disposable directory, then runs the installed extension UI and production filesystem code. The native chooser itself still requires a human click.
- The ZIP is an unpacked Chrome installation until a signed store package is published. Firefox and Safari are not supported because the product uses Chrome’s File System Access API.
