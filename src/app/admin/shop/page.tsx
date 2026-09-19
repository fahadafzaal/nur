import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { mediaUrl } from "@/lib/media";
import { StatusPill } from "@/components/admin/ui";

export default async function AdminShop() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, price_pence, currency, images, stock, active, sizes")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-body text-muted text-sm">Products in the modest-fashion shop.</p>
        <Link href="/admin/shop/new" className="nur-btn-primary font-body shrink-0 rounded-full px-5 py-2 text-xs font-semibold">
          + New product
        </Link>
      </div>

      {data && data.length > 0 ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {data.map((p) => {
            const img = mediaUrl((p.images as string[])[0]);
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/shop/${p.id}`}
                  className="border-gold/10 bg-surface/40 hover:border-gold/40 flex gap-3 rounded-xl border p-3 transition"
                >
                  <span className="bg-surface flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-body text-muted/40 text-[10px]">No photo</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-body text-parchment block truncate text-sm">{p.name}</span>
                    <span className="font-body text-gold-light block text-xs">{formatMoney(p.price_pence, p.currency)}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <StatusPill on={p.active} onLabel="Live" offLabel="Hidden" />
                      {p.stock !== null ? (
                        <StatusPill on={p.stock > 0} onLabel={`${p.stock} in stock`} offLabel="Sold out" />
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-gold/15 font-body text-muted mt-6 rounded-2xl border px-6 py-10 text-center text-sm">
          No products yet.
        </p>
      )}
    </div>
  );
}
