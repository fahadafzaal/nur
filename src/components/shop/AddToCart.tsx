"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";

type P = {
  id: string;
  slug: string;
  name: string;
  pricePence: number;
  currency: string;
  image: string | null;
  sizes: string[];
  stock: number | null;
};

export default function AddToCart({ product }: { product: P }) {
  const cart = useCart();
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = product.stock !== null && product.stock <= 0;
  const needsSize = product.sizes.length > 0;

  function add() {
    if (needsSize && !size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: needsSize ? size : null,
      unitPence: product.pricePence,
      currency: product.currency,
      image: product.image,
    });
    setAdded(true);
  }

  if (soldOut) {
    return <p className="font-body text-muted rounded-full border border-white/10 px-5 py-3 text-center text-sm">Sold out</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {needsSize ? (
        <div>
          <p className="font-body text-muted mb-2 text-xs tracking-wide">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setError(null);
                  setAdded(false);
                }}
                aria-pressed={size === s}
                className={`font-body min-w-12 rounded-full border px-4 py-2 text-sm transition ${
                  size === s ? "border-gold/70 bg-gold/10 text-gold-light" : "text-muted hover:text-parchment border-white/15"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {product.stock !== null && product.stock <= 5 ? (
        <p className="font-body text-rose text-xs">Only {product.stock} left</p>
      ) : null}

      <button type="button" onClick={add} className="nur-btn-primary font-body rounded-full px-8 py-3.5 text-sm font-semibold">
        Add to bag
      </button>
      {error ? <p className="text-rose font-body text-xs">{error}</p> : null}
      {added ? (
        <p className="font-body text-gold-light text-xs">
          Added. <Link href="/shop/cart" className="underline underline-offset-4">View your bag</Link>
        </p>
      ) : null}
    </div>
  );
}
