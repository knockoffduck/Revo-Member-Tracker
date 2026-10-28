"use client";

import { useEffect } from "react";

/**
 * Registers the Revo Tracker service worker.
 *
 * The worker caches the app shell so a cold open from the iOS home screen
 * paints from disk instead of waiting on a full server render.
 *
 * Registration is deferred until the load event so it never competes with the
 * first paint, and re-checked when the app returns to the foreground so a new
 * deploy is picked up within one launch.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // A failed registration must never break the app; it just means no cache.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
