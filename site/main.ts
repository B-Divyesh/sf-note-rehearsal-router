import './style.css';

const LICENSE_KEY = 'sb_license:note-rehearsal-router';
const url = new URL(window.location.href);
const returnedLicense = url.searchParams.get('license')?.trim();

if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  const panel = document.querySelector<HTMLElement>('#license-return')!;
  const token = document.querySelector<HTMLElement>('#returned-license')!;
  const status = document.querySelector<HTMLElement>('#license-status')!;
  panel.hidden = false;
  token.textContent = returnedLicense;
  document.querySelector<HTMLButtonElement>('#copy-license')!.addEventListener('click', async (event) => {
    await navigator.clipboard.writeText(returnedLicense);
    (event.currentTarget as HTMLButtonElement).textContent = 'Copied';
  });
  document.querySelector<HTMLButtonElement>('#close-license')!.addEventListener('click', () => {
    panel.hidden = true;
  });
  fetch(`https://api.sociobot.in/api/v1/products/note-rehearsal-router/verify?license=${encodeURIComponent(returnedLicense)}`)
    .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
    .then((result: { valid: boolean }) => { status.textContent = result.valid ? 'License verified.' : 'This license could not be verified. Contact the merchant from your receipt.'; })
    .catch(() => { status.textContent = 'Saved safely. Verification will happen in the extension when you are online.'; });
}
