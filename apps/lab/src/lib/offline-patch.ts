/**
 * Makes the framed app believe it is (not) online. The app reads `navigator.onLine`, which a service worker cannot change,
 * so the Lab (same origin) overrides it on the iframe's own navigator and fires the matching event. Applied again after
 * every document load because each load gets a fresh window.
 */
export function applyOnline(frame: HTMLIFrameElement, offline: boolean, announce = true): void {
  try {
    const win = frame.contentWindow;
    if (!win) return;
    const nav = win.navigator;
    const hasOwn = Object.prototype.hasOwnProperty.call(nav, 'onLine');
    if (offline) {
      Object.defineProperty(nav, 'onLine', { get: () => false, configurable: true });
      if (announce) win.dispatchEvent(new (win as unknown as typeof window).Event('offline'));
    } else if (hasOwn) {
      delete (nav as { onLine?: boolean }).onLine;
      if (announce) win.dispatchEvent(new (win as unknown as typeof window).Event('online'));
    }
  } catch {
    /* cross-origin frame (should not happen: the Lab and the app share an origin) */
  }
}

/**
 * Patch a freshly navigated document as early as possible, before the app's first request, instead of waiting for `load`.
 * Returns a cleanup function.
 */
export function patchEarly(frame: HTMLIFrameElement, offline: () => boolean): () => void {
  const patched = new WeakSet<Document>();
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    try {
      const doc = frame.contentDocument;
      if (doc && doc.URL !== 'about:blank' && !patched.has(doc)) {
        patched.add(doc);
        if (offline()) applyOnline(frame, true, false);
      }
    } catch {
      /* ignore */
    }
    if (tries > 600) clearInterval(timer);
  }, 5);
  return () => clearInterval(timer);
}
