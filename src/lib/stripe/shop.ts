"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { mediaUrl } from "@/lib/media";
import { SHIPPING_COUNTRIES, getStripe, isStripeConfigured } from "./config";

export type CheckoutLine = { productId: string; size: string | null; qty: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Starts a shop checkout.
 *
 * The bag sent from the browser is treated only as a list of product ids,
 * sizes and quantities. Everything that matters — whether each item is on
 * sale, its size, its stock and above all its price — is re-read from the
 * database here. The order and its items are written with the secret key,
 * so the shopper never writes order rows themselves.
 */
export async function createShopCheckout(lines: CheckoutLine[]): Promise<{ error: string }> {
  if (!isStripeConfigured || !isAdminClientConfigured) {
    return { error: "Checkout opens soon, in sha Allah." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/shop/cart");

  // ---- Validate the shape of what the browser sent ----
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 30) {
    return { error: "Your bag is empty." };
  }
  const merged = new Map<string, CheckoutLine>();
  for (const l of lines) {
    const qty = Math.floor(Number(l?.qty));
    if (!UUID.test(String(l?.productId)) || !Number.isFinite(qty) || qty < 1 || qty > 20) {
      return { error: "Something in your bag looks wrong — please remove it and add it again." };
    }
    const size = typeof l.size === "string" && l.size ? l.size : null;
    const key = `${l.productId}|${size ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { productId: l.productId, size, qty: Math.min(20, (prev?.qty ?? 0) + qty) });
  }

  // ---- Re-read every product from the database ----
  const ids = [...new Set([...merged.values()].map((l) => l.productId))];
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, price_pence, currency, images, sizes, stock, active")
    .in("id", ids);
  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));

  const qtyByProduct = new Map<string, number>();
  for (const l of merged.values()) {
    qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.qty);
  }

  const items: { product: NonNullable<ReturnType<typeof byId.get>>; size: string | null; qty: number }[] = [];
  for (const l of merged.values()) {
    const p = byId.get(l.productId);
    if (!p || !p.active) return { error: "An item in your bag is no longer available. Please remove it." };
    const sizes = (p.sizes as string[]) ?? [];
    if (sizes.length > 0 && (!l.size || !sizes.includes(l.size))) {
      return { error: `Please choose a size for ${p.name}.` };
    }
    if (p.stock !== null && (qtyByProduct.get(p.id) ?? 0) > p.stock) {
      return {
        error: p.stock === 0 ? `${p.name} has just sold out.` : `Only ${p.stock} of ${p.name} left — please lower the quantity.`,
      };
    }
    items.push({ product: p, size: sizes.length > 0 ? l.size : null, qty: l.qty });
  }

  const currencies = new Set(items.map((i) => i.product.currency as string));
  if (currencies.size !== 1) return { error: "Items in different currencies can't be bought together." };
  const currency = [...currencies][0];
  const total = items.reduce((n, i) => n + i.qty * (i.product.price_pence as number), 0);

  // ---- Record the order (secret key: shoppers cannot write orders) ----
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({ user_id: user.id, status: "pending", total_pence: total, currency, email: user.email })
    .select("id")
    .single();
  if (orderError || !order) return { error: "Couldn't start the order. Please try again." };

  const { error: itemsError } = await admin.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      name: i.product.name,
      size: i.size,
      unit_price_pence: i.product.price_pence,
      quantity: i.qty,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "Couldn't start the order. Please try again." };
  }

  // ---- Hand over to Stripe's hosted checkout ----
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    line_items: items.map((i) => {
      const image = mediaUrl(((i.product.images as string[]) ?? [])[0]);
      return {
        quantity: i.qty,
        price_data: {
          currency,
          unit_amount: i.product.price_pence as number,
          product_data: {
            name: i.size ? `${i.product.name} — ${i.size}` : (i.product.name as string),
            ...(image ? { images: [image] } : {}),
          },
        },
      };
    }),
    shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
    metadata: { order_id: order.id },
    payment_intent_data: { metadata: { order_id: order.id } },
    success_url: `${base}/shop/orders?placed=${order.id}`,
    cancel_url: `${base}/shop/cart`,
  });

  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  redirect(session.url ?? "/shop/cart");
}
