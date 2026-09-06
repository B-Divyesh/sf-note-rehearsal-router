# Note Rehearsal Router

Note Rehearsal Router is a Chrome extension for self-learners with saved Markdown notes. It shows one untriaged note and asks for one action: recall, solve, teach, do, or archive.

The extension writes a separate Markdown ticket under `.rehearsal/`. It does not change the source note or choose the action for you.

Live site: <https://note-rehearsal-router.sociobot.in/>

Sample workspace: <https://note-rehearsal-router.sociobot.in/demo/>

## Try the sample

Open `/demo/` and choose an action. Four sample notes and one completed route are already loaded. The current note advances and the created Markdown appears below it.

The sample uses `localStorage["demo:note-rehearsal-router:state"]`. **Reset demo** restores the sample. **Start for real** clears that demo key and opens the install section. The sample does not read extension data or local files.

## Use the extension

1. Install the unpacked extension in a Chromium browser with the File System Access API.
2. Open the extension and choose a Markdown folder.
3. Read the current note and choose one action. Number keys `1`–`5` select the same actions.
4. Use **Rescan** after adding a Markdown file.
5. Use **Undo last route** to remove the latest ticket and return its note to the queue.
6. Use **Export ledger** to download the routing record as Markdown.

The manifest requests browser storage only. It has no host permission or content script, so it cannot read web pages. The free workflow does not upload notes or use a hosted service.

## Price

The free tier routes 30 notes and includes ticket creation, undo, and export. A US $19 one-time license adds unlimited routing and custom ticket folders.

Checkout uses the Sociobot billing API. License verification sends only the token and caches the result for one day. A valid result enables the paid features in extension settings.

Production offer registration is external to this repository. Its public registration metadata is recorded in `/work/.evidence/billing-offer.json` during the factory repair.

## Privacy and removal

The selected folder handle, ledger, preferences, and license state use browser extension storage. **Forget local data** clears that browser-held state. Ticket files already written to the selected folder remain on disk.

See the published [privacy policy](https://note-rehearsal-router.sociobot.in/privacy/) and [terms](https://note-rehearsal-router.sociobot.in/terms/).

## Develop

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
npm run dev:site
```

WXT prints the development extension path. Load that directory from `chrome://extensions` with Developer mode enabled.

## Test and build

```sh
npm run typecheck
npm test
npm run build
```

`npm test` runs unit tests, a production build, responsive browser checks, accessibility checks, and the packaged extension. Playwright is pinned to 1.58.2.

Every public product claim is listed in [`.factory/claims.json`](.factory/claims.json). Run all claim checks with:

```sh
npm run test:claims
```

Each registry entry also has a focused command such as:

```sh
npm run test:claims -- --grep @claim:demo-sandbox
```

The build creates:

- `dist/extension/chrome-mv3/` — unpacked MV3 extension
- `dist/site/` — static deployment root
- `dist/site/downloads/note-rehearsal-router.zip` — extension archive linked from the site

Deploy only `dist/site/`. Factory infrastructure handles hosting and billing registration.

## Project map

- `entrypoints/` — extension background and full-tab interface
- `lib/` — routing, filesystem, storage, license, and sample modules
- `site/` — landing, demo, legal, and 404 pages
- `tests/` — unit, browser, accessibility, and claim checks
- `.factory/design.md` — visual system and asset provenance
- `.factory/demo.md` — sample isolation contract
- `.factory/handoff.md` — current verification record

## License

MIT. See [LICENSE](LICENSE).
