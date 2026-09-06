import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureLicenseFromUrl, LICENSE_KEY, restoreLicense, verifyLicense } from '../../lib/license';

const CACHE_KEY = `${LICENSE_KEY}:verdict`;

describe('license recovery and cache behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('captures a returned token and removes it from the visible URL', () => {
    history.replaceState({}, '', '/?license=returned-token&keep=1');
    expect(captureLicenseFromUrl()).toBe('returned-token');
    expect(localStorage.getItem(LICENSE_KEY)).toBe('returned-token');
    expect(location.search).toBe('?keep=1');
  });

  it('locks paid features after an invalid verification result', async () => {
    restoreLicense('invalid-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ valid: false, reason: 'invalid' }), { status: 200 })));
    await expect(verifyLicense(true)).resolves.toEqual({ unlocked: false, pending: false, notice: 'License no longer active' });
  });

  it('uses a recent valid result while offline', async () => {
    localStorage.setItem(LICENSE_KEY, 'cached-token');
    localStorage.setItem(CACHE_KEY, JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyLicense()).resolves.toEqual({ unlocked: true, pending: false, notice: 'Lifetime unlocked' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
