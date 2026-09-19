"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function ShopHeader() {
  const { count } = useCart();
  return (
    <div className="flex items-center justify-between gap-4">
      <Link href="/shop" className="font-display text-gold-light text-xl">
        NUR Shop
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/shop/orders" className="font-body text-muted hover:text-parchment px-2 text-xs">
          Orders
        </Link>
        <Link
          href="/shop/cart"
          className="border-gold/30 text-gold-light hover:border-gold/60 relative flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 7h12l-1 13H7L6 7Z" />
            <path d="M9 7a3 3 0 0 1 6 0" />
          </svg>
          <span className="font-body">Bag</span>
          {count > 0 ? (
            <span className="bg-gold text-ink font-body flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {count}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
