import Fanous from "@/components/Fanous";

export const metadata = { title: "Offline — NUR" };

/** Served by the service worker when the app is opened with no connection. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Fanous className="h-auto w-[140px] opacity-80" />
      <h1 className="font-display text-gold-light mt-8 text-2xl">You&apos;re offline</h1>
      <p className="font-body text-muted mt-3 max-w-xs text-sm leading-relaxed">
        NUR needs a connection. While you wait — SubhanAllah, Alhamdulillah,
        Allahu Akbar.
      </p>
    </main>
  );
}
