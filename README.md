# Note Rehearsal Router

Note Rehearsal Router is a local-first Chrome extension for self-learners whose Markdown notes have outgrown their attention. It presents one untriaged note at a time and turns a deliberate choice—**recall, solve, teach, do, or archive**—into one ordinary Markdown ticket on disk.

It does not summarize, search semantically, modify source notes, read browser pages, or sync note content to a server.

Live product page: <https://note-rehearsal-router.sociobot.in>

## How it works

1. Click the extension icon to open the rehearsal desk.
2. Choose a local folder with Chrome’s folder picker.
3. Read the current note excerpt and choose one action (or press `1`–`5`).
4. Router writes a separate ticket into `.rehearsal/` and advances the queue.

The extension rescans on open, when its tab regains focus, or when you press `R`/“Rescan.” It stores the chosen filesystem handle and routing ledger in browser extension storage. If Chrome pauses permission after a restart, the reconnect button requests it again from a user gesture.

Free routing covers 30 notes and always includes Markdown tickets, undo, and ledger export. The optional US $19 one-time license adds unlimited routing and custom ticket-folder names. Purchases use the Sociobot billing API; no payment provider is embedded here.

## Requirements

- Node.js 20 or newer
- npm
- Chrome/Chromium 110 or newer (the File System Access API is required)

## Develop

```sh
npm install
npm run dev          # WXT extension development
npm run dev:site     # landing site at a local Vite URL
```

Load the development output shown by WXT from `chrome://extensions` with Developer mode enabled.

## Test and build

```sh
npm run typecheck
npm test
npm run build
```

`npm test` runs Vitest domain/filesystem tests, a production build, Playwright responsive tests, axe accessibility checks, and a real packaged-extension launch. Playwright is pinned to 1.58.2 and uses the worker-provided Chromium installation.

`npm run build` (and `npm run build:site`) produces:

- `dist/extension/chrome-mv3/` — unpacked MV3 extension
- `dist/site/` — static deploy root (`index.html` is at this root)
- `dist/site/downloads/note-rehearsal-router.zip` — installable extension archive linked by the site

Deploy only `dist/site/`. Factory infrastructure handles hosting and product registration; this repository does not change DNS, billing, or deployment infrastructure.

## Privacy and data removal

Notes and filenames are read locally and never transmitted. License verification sends only the pasted license token to `api.sociobot.in`, at most once daily when a cached result exists. There are no analytics or third-party runtime scripts/fonts.

Use “Export” before uninstalling if you want the in-browser ledger. “Forget local data” clears the folder handle, preferences, and ledger; uninstalling clears extension storage. Neither action deletes the Markdown tickets already written to disk. See the published `/privacy/` and `/terms/` pages for details.

## Project map

- `entrypoints/` — WXT MV3 background and full-tab extension UI
- `lib/` — routing, Markdown, filesystem, persistence, and license modules
- `site/` — static product, privacy, and terms pages
- `tests/` — Vitest and Playwright coverage
- `.factory/design.md` — product-specific visual system and asset provenance
- `.factory/handoff.md` — verification record and release notes

## License

MIT. See [LICENSE](LICENSE).
