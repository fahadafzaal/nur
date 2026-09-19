import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMembershipConfigured, isStripeConfigured } from "@/lib/stripe/config";
import { isAdminClientConfigured } from "@/lib/supabase/admin";

const HEAD = { count: "exact", head: true } as const;

export default async function AdminOverview() {
  const supabase = await createClient();
  const [lessons, nasheeds, episodes, products, paidOrders, members] = await Promise.all([
    supabase.from("surah_lessons").select("*", HEAD).eq("published", true),
    supabase.from("nasheeds").select("*", HEAD).eq("published", true),
    supabase.from("seerah_episodes").select("*", HEAD).eq("published", true),
    supabase.from("products").select("*", HEAD).eq("active", true),
    supabase.from("orders").select("*", HEAD).eq("status", "paid"),
    supabase.rpc("admin_list_members"),
  ]);

  const all: { membership_status: string }[] = members.data ?? [];
  const paying = all.filter((m) => m.membership_status === "member").length;

  const tiles = [
    { label: "Accounts", value: all.length, href: "/admin/members" },
    { label: "Members", value: paying, href: "/admin/members" },
    { label: "Qur'an lessons", value: `${lessons.count ?? 0} / 114`, href: "/admin/lessons" },
    { label: "Nasheeds live", value: nasheeds.count ?? 0, href: "/admin/nasheeds" },
    { label: "Seerah episodes", value: episodes.count ?? 0, href: "/admin/seerah" },
    { label: "Products live", value: products.count ?? 0, href: "/admin/shop" },
    { label: "Orders to send", value: paidOrders.count ?? 0, href: "/admin/orders" },
  ];

  const setup = [
    { ok: isStripeConfigured, label: "Stripe secret key", detail: "STRIPE_SECRET_KEY in Vercel" },
    { ok: isMembershipConfigured, label: "Membership price", detail: "STRIPE_MEMBERSHIP_PRICE_ID in Vercel" },
    {
      ok: isAdminClientConfigured,
      label: "Supabase secret key",
      detail: "SUPABASE_SECRET_KEY in Vercel — lets confirmed payments switch memberships on",
    },
    { ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), label: "Stripe webhook", detail: "STRIPE_WEBHOOK_SECRET in Vercel" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="border-gold/15 bg-surface/40 hover:border-gold/40 rounded-2xl border p-4 transition"
          >
            <p className="font-display text-gold-light text-2xl tabular-nums">{t.value}</p>
            <p className="font-body text-muted mt-1 text-xs">{t.label}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="font-body text-muted text-xs tracking-[0.2em] uppercase">Payments setup</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {setup.map((s) => (
            <li key={s.label} className="border-gold/10 bg-surface/30 flex items-center gap-3 rounded-xl border px-4 py-3">
              <span className={s.ok ? "text-gold-light" : "text-muted/50"}>{s.ok ? "✓" : "○"}</span>
              <span className="min-w-0">
                <span className="font-body text-parchment block text-sm">{s.label}</span>
                <span className="font-body text-muted/70 block text-[11px]">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="font-body text-muted/70 mt-3 text-[11px] leading-relaxed">
          Until all four are set, membership and the shop show &ldquo;opening
          soon&rdquo; instead of taking payments. Everything else works now.
        </p>
      </section>
    </div>
  );
}
