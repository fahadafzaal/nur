"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/lessons", label: "Qur'an lessons" },
  { href: "/admin/reminders", label: "Reminders" },
  { href: "/admin/nasheeds", label: "Nasheeds" },
  { href: "/admin/seerah", label: "Seerah" },
  { href: "/admin/shop", label: "Shop" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="-mx-1 mt-6 overflow-x-auto px-1">
      <ul className="flex min-w-max gap-1.5">
        {SECTIONS.map((s) => {
          const active = s.href === "/admin" ? pathname === "/admin" : pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={`font-body block rounded-full border px-3.5 py-1.5 text-xs whitespace-nowrap transition ${
                  active
                    ? "border-gold/60 bg-gold/10 text-gold-light"
                    : "text-muted hover:text-parchment border-white/10"
                }`}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
