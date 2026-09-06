# Demo sandbox

- URL: `https://note-rehearsal-router.sociobot.in/demo/`
- Local URL after `npm run build`: `http://127.0.0.1:4173/demo/`
- Entry: choose **Try it with sample data** on the first screen.
- Sample: four realistic Markdown notes about retrieval practice, estimation, cache invalidation, and first-aid training.
- Initial state: one recall ticket already exists, one note is current, and two more notes wait behind it.
- Actions: choose recall, solve, teach, do, or archive. The demo advances the note and previews the created Markdown ticket.
- Reset: choose **Reset demo** in the persistent demo banner.
- Leave: choose **Start for real**. This clears the demo state and opens the install section.
- Storage: only `localStorage["demo:note-rehearsal-router:state"]` is used. Demo code does not read or write extension storage, folder handles, licenses, or local files.
- Network: the demo loads same-origin static files only. It does not call the billing API.
