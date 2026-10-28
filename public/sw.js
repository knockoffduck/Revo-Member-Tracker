/*
 * Revo Tracker service worker.
 *
 * Goal: the installed iOS home-screen app should paint from cache on launch
 * instead of paying DNS + TLS + full server render on every cold open.
 *
 * Strategy
 *  - /_next/static/*, /favicons/*, images, fonts -> cache-first (immutable content)
 *  - navigations                                -> stale-while-revalidate (instant paint,
 *                                                  refreshed in the background)
 *  - /api/*, /auth/*, RSC payloads (_rsc)       -> network only, never cached
 *
 * Rules that keep this safe:
 *  - Never resolve a fetch with undefined; failures fall back to the offline page.
 *  - Only cache same-origin GETs that returned ok and are not redirects.
 *  - Bump VERSION on a deploy that changes the shell so stale HTML is dropped.
 */

const VERSION = "v2";
const STATIC_CACHE = `revo-static-${VERSION}`;
const PAGE_CACHE = `revo-pages-${VERSION}`;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revo Tracker offline</title>
<style>
  html,body{height:100%;margin:0;background:#0A0A0A;color:#fafafa;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .wrap{height:100%;display:flex;flex-direction:column;gap:.75rem;
    align-items:center;justify-content:center;text-align:center;padding:1.5rem}
  p{margin:0;font-size:.95rem;color:#a1a1aa;max-width:22rem;line-height:1.5}
  a{margin-top:.5rem;color:#fafafa;font-size:.9rem}
</style></head><body><div class="wrap">
<strong style="font-size:1.05rem">Revo Tracker is offline</strong>
<p>No connection right now. The last page you viewed will load once you are back online.</p>
<a href="/">Retry</a></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // Precache the shell so the very next cold open has something to paint.
      // Key by absolute URL string: the Cache API rejects put() for requests in
      // "navigate" mode, and a string key is always stored as a plain GET.
      const cache = await caches.open(PAGE_CACHE);
      await Promise.allSettled(
        ["/", "/manifest.json"].map(async (path) => {
          const res = await fetch(path, { credentials: "same-origin" });
          if (res.ok) await cache.put(new URL(path, self.location.origin).href, res);
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGE_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("revo-") && !keep.has(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isCacheable(res) {
  return res && res.ok && res.type !== "opaque" && !res.redirected;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (isCacheable(res)) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch {
    const fallback = await cache.match(request, { ignoreSearch: true });
    return fallback || new Response("", { status: 504, statusText: "Offline" });
  }
}

// Cache API keys: navigations arrive as mode:"navigate", which put() rejects.
// Key every page by origin+pathname so it is stored and matched as a plain GET.
function pageKey(request) {
  const u = new URL(request.url);
  return u.origin + u.pathname;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const key = pageKey(request);
  const cached = await cache.match(key);

  const network = fetch(request)
    .then((res) => {
      if (isCacheable(res)) cache.put(key, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  if (cached) {
    // Serve instantly, refresh in the background.
    return cached;
  }

  const fresh = await network;
  if (fresh) return fresh;
  return new Response(OFFLINE_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept dynamic/auth/RSC traffic.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/favicons/") ||
    url.pathname.startsWith("/splash/") ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
  }
});
