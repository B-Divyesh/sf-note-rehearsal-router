# Independent verification — Note Rehearsal Router

**Result: PASS**

Verified on 2026-08-28 against candidate commit
`322e05cdf46701051ea646feb0eef6d5a6c0eafa` and live deployment
`https://note-rehearsal-router.sociobot.in/`.

## Acceptance outcome

The candidate delivers the researched core workflow: a locally scoped Chrome
extension scans a chosen Markdown folder, queues one untriaged note, and makes
one explicit `recall`, `solve`, `teach`, `do`, or `archive` Markdown ticket.
The route definitions, generated-ticket metadata and prompts, non-destructive
source behavior, ticket exclusion, route ledger, undo implementation, export,
free limit, local license restore/verification, and permission/error/recovery
states were inspected and exercised by the repository test suite. The manifest
is MV3 and requests only `storage`; it has neither host permissions nor content
scripts.

No blocker, critical, high, or medium defects were found.

## Clean-build evidence

- Clean tree at the requested commit; `npm ci` completed and reported **0
  vulnerabilities**. A later `npm audit --omit=dev` also reported **0
  vulnerabilities**.
- `npm run typecheck` passed.
- `npm test` passed: **10/10 Vitest tests**, production extension/site build,
  and **10/10 Playwright tests**; the two mobile extension invocations are
  intentional skips. An independent `npx playwright test` rerun completed in
  25.5 seconds with the same 10 passed / 2 skipped result.
- `npm run build` passed. It produced `dist/extension/chrome-mv3/`,
  `dist/site/`, and a valid `dist/site/downloads/note-rehearsal-router.zip`.
  `unzip -t` reported no compressed-data errors.
- Static artifact budgets are within the contract: extension initial JS
  20.76 KB, extension CSS 11.23 KB, local fonts 86.05 KB total, landing JS
  1.76 KB, landing CSS 10.68 KB, and largest responsive hero 54.49 KB.
  No CDN font or runtime script is shipped.

## Functional and boundary coverage

- Domain tests covered all five routes and verified exactly one actionable
  Markdown ticket for each, with route metadata, prompt, completion checkbox,
  source path, queue removal, and export.
- Filesystem integration tests covered recursive Markdown scan, case-insensitive
  `.md` discovery, non-Markdown exclusion, generated-ticket exclusion, ticket
  write, and source-file preservation.
- Reviewed boundary/recovery behavior: empty folders, over-2 MB note skip,
  duplicate ticket suffixes, absent/revoked folder permission, interrupted
  writes (ledger is updated only after successful write), undo confirmation,
  export, invalid/expired license response, offline cached license, empty
  pasted license, and the 30-note free limit.
- Packaged MV3 extension independently launched in Chromium. Its onboarding
  desk had one h1, semantic main region, no console errors, no serious/critical
  axe findings, and no horizontal overflow at 390 px. Keyboard Tab revealed a
  designed high-contrast skip-link focus ring; the route shortcuts are 1–5,
  R, and E.

The test container cannot select a real OS directory through Chromium's native
File System Access picker without a user-mediated dialog. This is an automation
limitation, not a product failure: the packaged extension launch plus its
filesystem/domain tests cover the supported browser API behavior. No product
files were changed for verification.

## Live deployment comparison

- Live `/` SHA-256 exactly equals built `dist/site/index.html`:
  `b33f152c8b4502bda7bb3e59b0bea5c2550e9adcef26f426f0172aafa926a09d`.
- The live JS, CSS, hero JPEG/AVIF responsive variants, and local Inter font
  each exactly equal the candidate build by SHA-256. The live downloadable ZIP
  contains byte-identical extracted extension files; its outer archive hash
  differs only because ZIP timestamps are 02:49 versus the local rebuild's
  03:22.
- Live desktop and 390px mobile Chromium checks found one h1, `lang="en"`, a
  main landmark, zero horizontal overflow, no page/console errors, no normal
  load external requests, and zero axe serious/critical violations.
- Keyboard Tab exposes the live skip link with `3px` `#ff6b4a` focus outline.
  With reduced motion, animation is absent and transitions are reduced to
  0.01 ms.
- A normal live landing-page visit sends no analytics/tracking requests. Static
  inspection confirms the only optional outbound call is the Sociobot license
  verification request, which transmits the license token only. The live
  invalid-token endpoint returned HTTP 200, `{ "valid": false,
  "reason": "invalid" }`, and `cache-control: no-store`.
- Live response headers include HSTS, `nosniff`, strict-origin referrer policy,
  camera/microphone/geolocation denial, and immutable one-year caching for
  hashed assets. HTML is short-revalidated (30 s); downloadable ZIPs cache for
  one hour.

## Notes / non-blocking observations

- This is a browser extension, not a PWA or backend; service-worker offline
  reload, package-consumer, backend health, concurrency, and persistence tests
  do not apply.
- Lighthouse CLI 13.4.1 could not complete in this container because its
  supplied Chromium tab crashed. This did not affect the executed browser,
  accessibility, bundle-budget, or production-build checks. The prior build
  handoff records local Lighthouse 99 performance / 100 accessibility / 100
  best practices / 100 SEO.
- The static-site response does not currently include a Content-Security-Policy
  header. This is a low-severity hardening opportunity; no inline third-party
  script, remote font, or analytics request is present, and it does not block
  the stated acceptance contract.

