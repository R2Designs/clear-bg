/*
  Enables `crossOriginIsolated` on static hosts that can't set custom
  response headers (GitHub Pages, most CDNs). Without it, onnxruntime-web's
  WASM backend is forced to run single-threaded — this is the difference
  between the segmentation model taking ~70s and ~10-15s on typical hardware.

  Works by registering itself as a service worker that injects
  Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy on every
  same-origin response, then reloading the page once so the new isolation
  state takes effect. If registration fails for any reason (unsupported
  browser, non-secure context, file:// origin) it silently no-ops and the
  app keeps working exactly as it does today, just single-threaded.

  Deploy this file alongside the HTML page it's referenced from — same
  directory, so its service-worker scope covers the page.
*/
const COEP = "require-corp";
const COOP = "same-origin";

if (typeof window === "undefined") {
  // Running as the service worker itself.
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) return response;
          const headers = new Headers(response.headers);
          headers.set("Cross-Origin-Embedder-Policy", COEP);
          headers.set("Cross-Origin-Opener-Policy", COOP);
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        })
        .catch((err) => {
          console.error("[coi-serviceworker] fetch failed", err);
          return new Response(null, { status: 599, statusText: "coi-serviceworker fetch failed" });
        })
    );
  });
} else {
  // Running on the page: register ourselves, then reload once the new
  // service worker actually controls the page.
  (function register() {
    if (window.crossOriginIsolated) return;
    if (!window.isSecureContext) return;
    if (!("serviceWorker" in navigator)) return;

    const reloadOnce = () => {
      if (sessionStorage.getItem("coiReloadedOnce")) return;
      sessionStorage.setItem("coiReloadedOnce", "1");
      window.location.reload();
    };

    navigator.serviceWorker
      .register(document.currentScript ? document.currentScript.src : "coi-serviceworker.js")
      .then(() => {
        if (navigator.serviceWorker.controller) reloadOnce();
      })
      .catch((err) => console.error("[coi-serviceworker] registration failed", err));

    navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
  })();
}
