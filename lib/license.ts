export const PRODUCT_SLUG = 'note-rehearsal-router';
export const CHECKOUT_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/checkout`;
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const CACHE_KEY = `${LICENSE_KEY}:verdict`;
const DAY = 86_400_000;

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
  reason?: string;
}

export interface LicenseResult {
  unlocked: boolean;
  pending: boolean;
  notice: string;
}

function readCache(): CachedVerdict | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as CachedVerdict | null;
  } catch {
    return null;
  }
}

export function captureLicenseFromUrl(): string | null {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return localStorage.getItem(LICENSE_KEY);
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(CACHE_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token.trim();
}

export function restoreLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(CACHE_KEY);
}

export function clearLicense(): void {
  localStorage.removeItem(LICENSE_KEY);
  localStorage.removeItem(CACHE_KEY);
}

export async function verifyLicense(force = false): Promise<LicenseResult> {
  const token = localStorage.getItem(LICENSE_KEY);
  const cached = readCache();
  if (!token) return { unlocked: false, pending: false, notice: '' };
  if (!force && cached && Date.now() - cached.checkedAt < DAY) {
    return { unlocked: cached.valid, pending: false, notice: cached.valid ? 'Lifetime unlocked' : 'License no longer active' };
  }
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(`Verification returned ${response.status}`);
    const verdict = (await response.json()) as { valid: boolean; reason?: string };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ valid: verdict.valid, reason: verdict.reason, checkedAt: Date.now() }));
    return { unlocked: verdict.valid, pending: false, notice: verdict.valid ? 'Lifetime unlocked' : 'License no longer active' };
  } catch {
    return {
      unlocked: cached?.valid ?? false,
      pending: false,
      notice: cached?.valid ? 'Unlocked · verification will retry when online' : 'Could not verify while offline'
    };
  }
}
