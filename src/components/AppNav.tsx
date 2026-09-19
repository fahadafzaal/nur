"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Persistent bottom navigation for the signed-in app.
 *
 * Five destinations — Seerah and Shop are reached from the home hub, since
 * seven items in a bottom bar is unusable on a phone.
 */
const ITEMS = [
  {
    href: "/home",
    label: "Home",
    icon: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  },
  {
    href: "/quran",
    label: "Qur'an",
    icon: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5zM6.5 18H20v3H6.5A1.5 1.5 0 0 1 5 19.5 1.5 1.5 0 0 1 6.5 18z",
  },
  {
    href: "/nasheeds",
    label: "Nasheed",
    icon: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0m10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0",
  },
  {
    href: "/tasbeeh",
    label: "Tasbeeh",
    icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4.2a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2m4.1 2.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2m-8.2 0a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2M12 14a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 12 14",
  },
  {
    href: "/health",
    label: "Health",
    icon: "M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z",
  },
];

/** The splash and the auth screens are deliberately chrome-free. */
const HIDDEN_ON = ["/", "/join", "/sign-in", "/offline"];

export default function AppNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.includes(pathname) || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav
      className="border-gold/15 bg-ink/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 transition ${
                  active
                    ? "text-gold-light"
                    : "text-muted hover:text-parchment"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                <span className="font-body text-[10px] tracking-wide">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
