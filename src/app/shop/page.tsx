import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/shop";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Shop — NUR" };

export default async function ShopPage() {
  const supabase = await createClient();
  const products = await getProducts(supabase);

  return (
    <>
      <header className="text-center">
        <h1 className="font-display text-parchment text-3xl">Modest by design</h1>
        <p className="font-body text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          Pieces made to be worn with ease and dignity.
        </p>
      </header>

      {products.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((p) => {
            const soldOut = p.stock !== null && p.stock <= 0;
            return (
              <li key={p.id}>
                <Link href={`/shop/${p.slug}`} className="group block">
                  <span className="border-gold/10 bg-surface/50 relative block aspect-[4/5] overflow-hidden rounded-2xl border">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-gold/30 flex h-full items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-8 w-8"><path d="M12 1 L23 12 L12 23 L1 12 Z" fill="currentColor" /></svg>
                      </span>
                    )}
                    {soldOut ? (
                      <span className="bg-ink/80 font-body text-muted absolute top-2 left-2 rounded-full px-2.5 py-1 text-[10px]">
                        Sold out
                      </span>
                    ) : null}
                  </span>
                  <span className="font-display text-parchment mt-3 block truncate text-base">{p.name}</span>
                  <span className="font-body text-gold-light block text-sm">{formatMoney(p.pricePence, p.currency)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-gold/15 bg-surface/40 font-body text-muted mx-auto mt-10 max-w-md rounded-2xl border px-6 py-12 text-center text-sm leading-relaxed">
          The first collection is being prepared. Check back soon, in sha Allah.
        </p>
      )}
    </>
  );
}
