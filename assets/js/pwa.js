/**
 * Register the service worker when supported.
 * Uses URLs relative to this module so GitHub Pages subpaths work.
 */

export function initPwa() {
  if (!("serviceWorker" in navigator)) return;

  const swUrl = new URL("../../sw.js", import.meta.url);
  const scope = new URL("../../", import.meta.url);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl, { scope: scope.pathname }).catch(() => {
      /* Registration can fail on unsupported hosts or file:// — ignore quietly. */
    });
  });
}
