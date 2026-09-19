import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import OrderStatus from "@/components/admin/OrderStatus";

type Shipping = {
  name?: string;
  address?: { line1?: string; line2?: string; city?: string; postal_code?: string; state?: string; country?: string };
} | null;

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, status, total_pence, currency, email, shipping, created_at, order_items(name, size, quantity, unit_price_pence)")
    .order("created_at", { ascending: false })
    .limit(100);
  // Pending checkouts that were never paid are noise; hide them by default.
  if (show !== "all") query = query.neq("status", "pending");
  const { data: orders } = await query;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-body text-muted text-sm">Paid orders appear here to be packed and sent.</p>
        <a href={show === "all" ? "/admin/orders" : "/admin/orders?show=all"} className="font-body text-gold/80 text-xs">
          {show === "all" ? "Hide unpaid checkouts" : "Show unpaid checkouts"}
        </a>
      </div>

      {orders && orders.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-3">
          {orders.map((o) => {
            const ship = o.shipping as Shipping;
            const a = ship?.address;
            return (
              <li key={o.id} className="border-gold/15 bg-surface/40 rounded-2xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-parchment text-sm">
                      {formatMoney(o.total_pence, o.currency)} · {o.email ?? "no email"}
                    </p>
                    <p className="font-body text-muted/70 text-[11px]">
                      {new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · #{o.id.slice(0, 8)}
                    </p>
                  </div>
                  <OrderStatus id={o.id} status={o.status} />
                </div>
                <ul className="mt-3 flex flex-col gap-1">
                  {(o.order_items as { name: string; size: string | null; quantity: number; unit_price_pence: number }[]).map((it, i) => (
                    <li key={i} className="font-body text-muted text-xs">
                      {it.quantity} × {it.name}
                      {it.size ? ` (${it.size})` : ""} — {formatMoney(it.unit_price_pence * it.quantity, o.currency)}
                    </li>
                  ))}
                </ul>
                {a ? (
                  <p className="font-body text-muted/80 mt-3 text-xs leading-relaxed">
                    {[ship?.name, a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-gold/15 font-body text-muted mt-6 rounded-2xl border px-6 py-10 text-center text-sm">
          No orders yet.
        </p>
      )}
    </div>
  );
}
