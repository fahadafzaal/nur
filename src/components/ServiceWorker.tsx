"use client";

import { useEffect } from "react";

/** Registers /sw.js in production only — in development it would cache dev builds. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* installability degrades gracefully; nothing else depends on it */
    });
  }, []);
  return null;
}
