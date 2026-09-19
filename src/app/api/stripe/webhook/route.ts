import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { WEBHOOK_SECRET, getStripe, isStripeConfigured } from "@/lib/stripe/config";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

/**
 * POST /api/stripe/webhook
 *
 * The only place a membership switches on or off, or an order becomes paid.
 * Nothing here trusts the browser: every event is verified against
 * STRIPE_WEBHOOK_SECRET before anything is written, and writes use the
 * secret-key client because members cannot change these columns themselves.
 *
 * Stripe retries on any non-2xx response, so handlers are idempotent — an
 * order moves pending → paid only once, and stock is reduced only by the
 * call that made that move.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured || !WEBHOOK_SECRET || !isAdminClientConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  // The raw body, exactly as sent — parsing it first would break verification.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await onCheckoutPaid(event.data.object);
        break;
      case "checkout.session.expired":
        await onCheckoutExpired(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await onSubscriptionChange(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`stripe webhook ${event.type} failed`, err);
    // 500 so Stripe retries.
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function onCheckoutPaid(session: Stripe.Checkout.Session) {
  const admin = createAdminClient();

  // ---- Membership ----
  if (session.mode === "subscription") {
    const userId = session.client_reference_id;
    if (!userId) return;
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const update: Record<string, string> = { membership_status: "member" };
    if (customer) update.stripe_customer_id = customer;
    const { error } = await admin.from("profiles").update(update).eq("id", userId);
    if (error) throw error;
    return;
  }

  // ---- Shop order ----
  if (session.mode !== "payment" || session.payment_status !== "paid") return;
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const ship = session.collected_information?.shipping_details ?? null;

  // Conditional on still being pending: a retried event matches no row,
  // so stock is never reduced twice.
  const { data: moved, error } = await admin
    .from("orders")
    .update({
      status: "paid",
      email: session.customer_details?.email ?? undefined,
      shipping: ship ? { name: ship.name, address: ship.address } : null,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  if (!moved || moved.length === 0) return;

  const { data: items } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const { data: product } = await admin
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .maybeSingle();
    if (!product || product.stock === null) continue;
    await admin
      .from("products")
      .update({ stock: Math.max(0, product.stock - item.quantity) })
      .eq("id", item.product_id);
  }
}

async function onCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  await createAdminClient()
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending");
}

/**
 * Keeps membership in step with the subscription. past_due still counts as
 * a member — Stripe is retrying the card, and cutting someone off for a
 * failed first attempt is unkind. Ended or unpaid subscriptions lapse.
 */
async function onSubscriptionChange(sub: Stripe.Subscription) {
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const ended = ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
  if (!active && !ended) return; // incomplete / paused: leave as is

  const admin = createAdminClient();
  const status = active ? "member" : "lapsed";
  const userId = sub.metadata?.supabase_user_id;

  if (userId) {
    const { error } = await admin.from("profiles").update({ membership_status: status }).eq("id", userId);
    if (error) throw error;
    return;
  }

  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { error } = await admin
    .from("profiles")
    .update({ membership_status: status })
    .eq("stripe_customer_id", customer);
  if (error) throw error;
}
