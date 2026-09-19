"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * "Install NUR" card on the home screen.
 *
 * Android/Chrome: captures the browser's install prompt and offers a
 * one-tap button. iPhone: Safari has no prompt, so it explains Share →
 * Add to Home Screen. Hidden when already running as an installed app, or
 * once dismissed.
 */
export default function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("nur.install.dismissed") === "1";
    } catch {
      /* ignore */
    }
    if (standalone || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem("nur.install.dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border-gold/25 bg-gold/[0.05] mt-6 flex items-center gap-4 rounded-2xl border px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-display text-gold-light text-base">Add NUR to your phone</p>
        <p className="font-body text-muted mt-0.5 text-xs leading-relaxed">
          {ios
            ? "In Safari, tap Share, then “Add to Home Screen”."
            : "Opens full screen, like any other app."}
        </p>
      </div>
      {prompt ? (
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === "accepted") setHidden(true);
            setPrompt(null);
          }}
          className="nur-btn-primary font-body shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
        >
          Install
        </button>
      ) : null}
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-muted hover:text-parchment shrink-0 p-1">
        ✕
      </button>
    </div>
  );
}
