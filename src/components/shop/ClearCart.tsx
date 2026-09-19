"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Empties the bag once, after returning from a successful checkout. */
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
