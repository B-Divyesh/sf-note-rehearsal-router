# Review 1 — Route Markdown notes into rehearsal actions

**VERDICT: FAIL**

- Findings: **10** — 3 high, 4 medium, 3 low
- Untested public claim groups: **20**
- Review date: 2026-09-05
- Live URL: <https://note-rehearsal-router.sociobot.in>
- Implementation candidate: `27faed6ab37db8ab3e28cacd83bb7934b3b9590c`
- Test and README candidate: `322e05cdf46701051ea646feb0eef6d5a6c0eafa`
- Documentation candidate reviewed: `88e200b6b93568e900dfa7faad90f5e67fa95473`

This product does not pass. A PASS requires no findings and no untested claims.

## First screen before scrolling

- Job: route one local Markdown note into a recall, solve, teach, do, or archive ticket.
- Audience: self-learners with a backlog of saved Markdown notes. The first screen does not state this audience directly.
- First action: **Download for Chrome**. There is no **Try it with sample data** action.

The desktop and 390 px phone first screens were opened in separate fresh browser contexts. Both showed the same job and download action. Neither offered a sample workflow.

## Findings

### R1 — High — The required one-click sample does not exist

There is no sample action on the first screen and no sample action in the installed extension. `/demo` returns the normal landing page. `.factory/demo.md` is absent. There is no populated sample, persistent “Demo — sample data, nothing is saved” label, demo reset, start-for-real action, or separate demo storage namespace.

The requested sample, reset, and real-data-isolation checks therefore fail. The injected disposable filesystem used later in this review proves that the routing UI can process a sample, but it is reviewer test equipment and is not a product demo.

### R2 — High — The advertised purchase action is broken

The live page advertises a US $19 one-time purchase. On 2026-09-05, its `Buy lifetime unlock` URL returned HTTP 404 with JSON instead of checkout. A visitor cannot buy the advertised tier.

The earlier handoff listed production paid-product registration as a release step. That gap is now a live user-path defect. Invalid-license verification itself returned HTTP 200 with `valid:false`, `reason:"invalid"`, and `cache-control:no-store`.

### R3 — High — Public claims have no claim registry or tagged tests

`.factory/claims.json` is absent. No test contains an `@claim:` tag. The site, legal pages, extension, and README contain 20 public claim groups listed below. None has the required clean-demo command and observable claim test.

The repository tests give useful incidental evidence for several behaviors, but they do not satisfy the claim contract. The real OS folder-picker workflow also remains untested end to end in an installed clean consumer profile.

### R4 — Medium — Unknown URLs do not return a designed 404

`/definitely-missing-review-1` returned HTTP 200 and the full landing page. There is no `404.html` or designed not-found route. This is not a finding merely because a deliberate 404 was requested; it is a finding because the product does not send one and gives visitors the wrong page.

### R5 — Medium — The public copy does not meet the plain-words contract

The title and h1 use “Give every note one direction” instead of naming the concrete routing job. The first screen does not name self-learners. Its main sentence is 24 words, above the 22-word limit. Copy such as “A local lane out of the note graveyard,” “A deliberate five-way junction,” “A smaller trust boundary,” and “Put one good intention in motion” uses metaphor or mood headings. `.factory/copy-audit.md` is absent.

### R6 — Medium — Required site metadata and shared page structure are incomplete

The landing page has no canonical link, Open Graph metadata, Twitter card metadata, or Apple touch icon. Legal pages have no nav landmark or standard product header/footer. The landing footer has no version or build ID. The sitemap cannot list the required demo or 404 routes because those routes do not exist.

Route titles, `lang`, one h1, main landmarks, favicon, robots file, sitemap, and legal page content are present.

### R7 — Medium — Text size, resize, and touch targets miss the accessibility contract

At normal size, live axe scans found no serious or critical issues, keyboard focus was visible, and the 390 px page did not overflow. However:

- Informational and actionable text is rendered as small as 11.2 px on the site and 10.88 px in the extension; extension toolbar labels and its primary folder button are 11–12 px.
- At 200% text size on a 390 px viewport, the h1, lead, facts, and actions extend beyond the right edge while `main { overflow:hidden }` hides the lost content.
- The phone home link is 36×36 px and the price-card Terms link is about 33×14 px, below 44×44 px.

This conflicts with the attached accessibility baseline and the repository design thesis, which says app body text never falls below 16 px.

### R8 — Low — The earlier CSP finding remains open

The live responses still have no Content-Security-Policy header. There is also no `frame-ancestors` policy. This was the only low-severity product finding in `.factory/verification.md`; it is not fixed.

### R9 — Low — The clean install now reports a vulnerable build dependency

`npm ci` and `npm audit --json` report one moderate advisory in direct dev dependency `fflate@0.8.2` (`GHSA-px8p-9vwx-vf98`). The package is used to build the download ZIP; the reported vulnerable operation is not used in the shipped runtime. This is low product risk, but the prior handoff statement of zero vulnerabilities is no longer current.

### R10 — Low — Reset leaves a stale screen-reader status message

After routing the sample and choosing **Forget local data**, extension storage was empty and the generated ticket remained, as promised. The live status region still contained “Why spacing works routed to recall” after reset. A screen reader can receive an obsolete success message after the data has been cleared.

## Untested public claims

All 20 groups below lack a `.factory/claims.json` entry and exactly one tagged test.

| # | Public claim group | Main locations |
| --- | --- | --- |
| 1 | Shows one untriaged note at a time and advances after routing | README, extension |
| 2 | Each of five choices creates exactly one action ticket | Landing, README, extension |
| 3 | Writes separate Markdown tickets under `.rehearsal/` for any editor | Landing, README, extension |
| 4 | Never changes source notes | Landing, README, legal, extension |
| 5 | Does not summarize or search semantically | Landing, README |
| 6 | Does not read browser pages | Landing, README, privacy, extension |
| 7 | Does not upload or cloud-sync note content, paths, or history | Landing, README, privacy, extension |
| 8 | Access is limited to the folder the user chooses | Landing, privacy |
| 9 | Rescans on open, focus return, and manual command | README |
| 10 | Folder handle, ledger, and preferences stay in local browser storage | README, privacy |
| 11 | The free tier routes 30 notes | Landing, README, terms, extension |
| 12 | Undo is included in the free tier | README, extension |
| 13 | Ledger export is always available and free | Landing, README, privacy, extension |
| 14 | $19 once enables unlimited routing and custom ticket folders | Landing, README, terms, extension |
| 15 | License verification sends only the token and is cached for one day | README, privacy |
| 16 | There are no analytics, advertising, trackers, or third-party runtime assets | Landing, README, privacy |
| 17 | Forget local data clears browser-held state but leaves disk tickets | README, privacy, extension |
| 18 | Uninstall clears browser storage but leaves disk tickets | README, privacy |
| 19 | The local free experience works without a hosted service | Terms, extension |
| 20 | Chrome 110+ support, install under a minute, and all future local updates | Landing, README |

Some groups should be split into smaller claim entries when the registry is added. “Install in under a minute” needs a timed assertion. “All future local updates” cannot be proved and should be removed.

## Checks that passed

### Live site and installed artifact

- Fresh desktop at 1440×900 and phone at 390×844: HTTP 200, no console or page errors, no normal-load third-party requests, one h1, `lang="en"`, main landmark, and no normal-size horizontal overflow.
- Keyboard: skip link is first, all checked controls are reachable, and focus uses a visible 3 px coral outline. Extension settings return focus to the Settings button with Escape.
- Reduced motion: the media query matches, smooth scroll is disabled, and transitions/animations fall to 0.01 ms.
- Live Playwright axe 4.10.2: zero violations on the landing page and installed extension. Clean-suite axe checks also passed landing, privacy, and terms pages. The standalone axe CLI could not spawn the supplied browser directory; the allowed Playwright axe integration completed instead.
- `/privacy/` and `/terms/`: HTTP 200, distinct titles, one h1, and one main landmark.
- Normal landing requests were same-origin only. The installed extension requested only its own packaged resources until an explicit license action.
- Offline: the installed extension reloaded from its package in an offline browser context and retained its onboarding UI.
- Live ZIP: valid archive with 12 files. Extracted files are byte-identical to the clean candidate build. The outer ZIP differs only in archive metadata.
- Live `index.html` SHA-256 equals the candidate build: `b33f152c8b4502bda7bb3e59b0bea5c2550e9adcef26f426f0172aafa926a09d`.

### Normal, invalid, boundary, and recovery paths

- A reviewer-injected disposable folder showed a realistic spacing-practice note. Choosing Recall created one separate Markdown ticket with source metadata, prompt, and completion fields, then advanced to the complete state.
- Reset cleared `chrome.storage.local` and retained the disposable ticket. No real user data was read or changed.
- Empty Markdown, a file over 2 MB, duplicate ticket filenames, and a simulated disk-write failure were exercised against production modules. Empty content got recovery copy, the large file was skipped, the duplicate gained `-2`, and the write error propagated without a successful ledger update.
- Invalid license verification returned a clear invalid result. The checkout path failed as recorded in R2.
- Source and tests cover permission-paused, empty folder, queue complete, free limit, write failure, undo confirmation, invalid license, and offline cached-license states. They are not claim-tagged and several are not driven through the installed UI.

### Clean checkout commands

From a new clone of `88e200b6b93568e900dfa7faad90f5e67fa95473`:

| Command | Result |
| --- | --- |
| `npm ci` | Completed; 231 packages; one moderate advisory |
| `npm run typecheck` | Passed |
| `npm test` | Passed: 10 unit tests, 10 browser tests, 2 intentional mobile-extension skips |
| `npm run build` | Passed; created `dist/site/`, unpacked MV3 extension, and ZIP |
| Declared claim commands | None exist because `.factory/claims.json` is missing |

The extension bundle is 126.60 KB total. Initial extension JavaScript is 20.76 KB, CSS is 11.23 KB, and local fonts total 86.05 KB.

### Performance

Lighthouse 12.8.2 against the live mobile page:

- Performance 100
- Accessibility 100
- Best practices 100
- SEO 100
- FCP 1.0 s; LCP 1.1 s; TBT 30 ms; CLS 0.016; speed index 1.0 s
- Transfer size 111 KiB

These scores do not cover the contract defects above.

## Earlier review and handoff disposition

| Earlier item | Current disposition |
| --- | --- |
| Missing CSP header | Still open; R8 |
| OS directory picker not exercised by automation | Still not proven with a real folder; included in R3 untested claims |
| Lighthouse could not run in the prior verifier container | Resolved for measurement; current live run completed with 100/100/100/100 |
| Production paid-product registration left for release | Now a live HTTP 404; R2 |
| Prior `npm audit` reported zero vulnerabilities | No longer current; R9 |
| Prior live artifact matched candidate | Still true for product files |

The prior PASS predates the attached claims, demo, plain-words, and site-structure contracts. It does not establish a current strict pass.

## Scope and applicability

- This is a static site plus MV3 browser extension. Backend tenant isolation, server restart persistence, health, and 429/Retry-After checks do not apply.
- The brief explicitly excludes LLM summaries. No useful AI step is missing. Import is the chosen local folder, export exists, and cloud sync is a non-goal.
- No infrastructure, DNS, billing configuration, secrets, other products, or real user data were accessed or changed.

## Evidence files

The review evidence is under `/work/.evidence/`, including `live-browser-audit.json`, `extension-audit.json`, `extension-injected-flow.json`, `boundary-audit.json`, `lighthouse.json`, response headers, live HTML, and screenshots.
