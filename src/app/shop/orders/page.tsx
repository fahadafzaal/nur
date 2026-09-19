import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import ClearCart from "@/components/shop/ClearCart";

export const metadata = { title: "Your orders — NUR Shop" };

const LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Being prepared",
  fulfilled: "Sent",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const { placed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_pence, currency, created_at, order_items(name, size, quantity)")
    .eq("user_id", user?.id ?? "")
    .neq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <>
      {placed ? <ClearCart /> : null}
      <h1 className="font-display text-parchment text-2xl">Your orders</h1>

      {placed ? (
        <p role="status" className="border-gold/40 bg-gold/10 text-gold-light font-body mt-6 rounded-2xl border px-5 py-4 text-sm leading-relaxed">
          Thank you — your order is placed. A receipt is on its way to your
          email. It may take a few seconds to appear below.
        </p>
      ) : null}

      {orders && orders.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="border-gold/15 bg-surface/40 rounded-2xl border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-body text-muted text-xs">
                  {new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })} · #{o.id.slice(0, 8)}
                </p>
                <span className={`font-body rounded-full border px-2.5 py-0.5 text-[11px] ${o.status === "paid" ? "border-gold/50 text-gold-light" : "text-muted border-white/15"}`}>
                  {LABEL[o.status] ?? o.status}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-1">
                {(o.order_items as { name: string; size: string | null; quantity: number }[]).map((it, i) => (
                  <li key={i} className="font-body text-parchment text-sm">
                    {it.quantity} × {it.name}
                    {it.size ? <span className="text-muted"> · {it.size}</span> : null}
                  </li>
                ))}
              </ul>
              <p className="font-display text-gold-light mt-3 text-lg">{formatMoney(o.total_pence, o.currency)}</p>
            </li>
          ))}
        </ul>
      ) : !placed ? (
        <div className="border-gold/15 bg-surface/40 mt-6 rounded-2xl border px-6 py-12 text-center">
          <p className="font-body text-muted text-sm">No orders yet.</p>
          <Link href="/shop" className="nur-btn-secondary font-body mt-5 inline-block rounded-full px-6 py-2.5 text-xs">
            Browse the shop
          </Link>
        </div>
      ) : null}
    </>
  );
}
