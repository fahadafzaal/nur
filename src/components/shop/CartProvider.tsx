"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  size: string | null;
  /** Shown to the shopper only. The server re-prices everything at checkout. */
  unitPence: number;
  currency: string;
  image: string | null;
  qty: number;
};

type Cart = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, size: string | null, qty: number) => void;
  remove: (productId: string, size: string | null) => void;
  clear: () => void;
};

const KEY = "nur.cart.v1";
const MAX_QTY = 20;
const CartContext = createContext<Cart | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

const same = (a: CartItem, id: string, size: string | null) => a.productId === id && a.size === size;

/**
 * The shopping bag, kept in this browser only. Prices here are for display;
 * the checkout action ignores them and reads current prices from the
 * database, so editing local storage cannot change what anyone pays.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* empty bag */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* not fatal */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((list) => {
      const existing = list.find((x) => same(x, item.productId, item.size));
      if (existing) {
        return list.map((x) =>
          same(x, item.productId, item.size) ? { ...x, ...item, qty: Math.min(MAX_QTY, x.qty + qty) } : x,
        );
      }
      return [...list, { ...item, qty: Math.min(MAX_QTY, qty) }];
    });
  }, []);

  const setQty = useCallback((id: string, size: string | null, qty: number) => {
    setItems((list) =>
      qty <= 0
        ? list.filter((x) => !same(x, id, size))
        : list.map((x) => (same(x, id, size) ? { ...x, qty: Math.min(MAX_QTY, qty) } : x)),
    );
  }, []);

  const remove = useCallback((id: string, size: string | null) => {
    setItems((list) => list.filter((x) => !same(x, id, size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, x) => n + x.qty, 0),
      subtotal: items.reduce((n, x) => n + x.qty * x.unitPence, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
