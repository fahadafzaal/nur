"use client";

import { useEffect } from "react";

/**
 * A now-playing bar reports its height through a CSS variable so floating
 * controls (the ambient button) can sit above it instead of underneath.
 * Only one bar is ever visible: recitation and library playback stop each
 * other via audio focus.
 */
export function usePlayerBarHeight(visible: boolean) {
  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.style.setProperty("--nur-player-h", "4.75rem");
    return () => {
      root.style.removeProperty("--nur-player-h");
    };
  }, [visible]);
}
