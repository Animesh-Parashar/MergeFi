export type WaitForCookiesOpts = {
  cookieName?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
};

/**
 * Wait until a specific cookie appears (or timeout).
 * Resolves immediately on SSR (no document).
 */
export async function waitForCookies(opts: WaitForCookiesOpts = {}): Promise<void> {
  const {
    cookieName,
    timeoutMs = 7000,
    pollIntervalMs = 150,
  } = opts;

  if (typeof document === 'undefined') return;

  const start = Date.now();
  if (cookieName) {
    while (Date.now() - start < timeoutMs) {
      if (document.cookie && document.cookie.indexOf(`${cookieName}=`) !== -1) return;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    return;
  }

  // Fallback: if no cookieName provided, just wait a short stable period
  const stableTimeout = 300;
  let last = document.cookie;
  let stableSince = Date.now();
  while (Date.now() - start < timeoutMs) {
    const now = document.cookie;
    if (now !== last) {
      last = now;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= stableTimeout) {
      return;
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  return;
}