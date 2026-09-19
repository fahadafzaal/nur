"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/money";
import { createShopCheckout } from "@/lib/stripe/shop";

export default function CartView({ checkoutEnabled }: { checkoutEnabled: boolean }) {
  const cart = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (cart.items.length === 0) {
    return (
      <div className="border-gold/15 bg-surface/40 mx-auto max-w-md rounded-2xl border px-6 py-12 text-center">
        <p className="font-display text-parchment text-lg">Your bag is empty</p>
        <Link href="/shop" className="nur-btn-secondary font-body mt-6 inline-block rounded-full px-6 py-2.5 text-xs">
          Browse the shop
        </Link>
      </div>
    );
  }

  const currency = cart.items[0]?.currency ?? "gbp";

  function checkout() {
    setError(null);
    startTransition(async () => {
      const result = await createShopCheckout(
        cart.items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
      );
      // Only reached on failure — success redirects to Stripe.
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem]">
      <ul className="flex flex-col gap-3">
        {cart.items.map((i) => (
          <li key={`${i.productId}|${i.size}`} className="border-gold/10 bg-surface/40 flex gap-4 rounded-2xl border p-3">
            <Link href={`/shop/${i.slug}`} className="bg-surface h-24 w-20 shrink-0 overflow-hidden rounded-xl">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/shop/${i.slug}`} className="font-display text-parchment truncate text-base">
                {i.name}
              </Link>
              {i.size ? <p className="font-body text-muted text-xs">Size {i.size}</p> : null}
              <p className="font-body text-gold-light mt-1 text-sm">{formatMoney(i.unitPence * i.qty, i.currency)}</p>
              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="flex items-center rounded-full border border-white/10">
                  <button
                    type="button"
                    aria-label="One fewer"
                    onClick={() => cart.setQty(i.productId, i.size, i.qty - 1)}
                    className="text-muted hover:text-parchment px-3 py-1"
                  >
                    −
                  </button>
                  <span className="font-body text-parchment w-6 text-center text-sm tabular-nums">{i.qty}</span>
                  <button
                    type="button"
                    aria-label="One more"
                    onClick={() => cart.setQty(i.productId, i.size, i.qty + 1)}
                    className="text-muted hover:text-parchment px-3 py-1"
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => cart.remove(i.productId, i.size)} className="font-body text-muted hover:text-rose text-xs">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="border-gold/20 bg-surface/50 h-fit rounded-2xl border p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-muted text-sm">Subtotal</span>
          <span className="font-display text-parchment text-xl">{formatMoney(cart.subtotal, currency)}</span>
        </div>
        <p className="font-body text-muted/70 mt-1 text-[11px]">Delivery is added at checkout.</p>

        {checkoutEnabled ? (
          <button
            type="button"
            onClick={checkout}
            disabled={pending}
            className="nur-btn-primary font-body mt-5 w-full rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Opening secure checkout…" : "Checkout"}
          </button>
        ) : (
          <p className="font-body text-muted border-gold/20 mt-5 rounded-xl border px-4 py-3 text-center text-xs leading-relaxed">
            Checkout opens soon, in sha Allah.
          </p>
        )}
        {error ? <p className="text-rose font-body mt-3 text-xs leading-relaxed">{error}</p> : null}
        <p className="font-body text-muted/60 mt-4 text-center text-[10px]">Secure payment by Stripe</p>
      </aside>
    </div>
  );
}
