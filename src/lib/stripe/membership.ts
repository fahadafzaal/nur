"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { MEMBERSHIP_PRICE_ID, getStripe, isMembershipConfigured } from "./config";

async function origin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
}

/**
 * Finds or creates the Stripe customer for the signed-in user and records
 * it on their profile. stripe_customer_id is one of the columns members
 * cannot write themselves, so the secret-key client writes it.
 */
async function customerFor(userId: string, email: string | undefined) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email,
    name: profile?.display_name ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  await createAdminClient()
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function startMembershipCheckout() {
  if (!isMembershipConfigured || !isAdminClientConfigured) {
    redirect("/membership?status=unavailable");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/membership");

  const base = await origin();
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: await customerFor(user.id, user.email),
    line_items: [{ price: MEMBERSHIP_PRICE_ID, quantity: 1 }],
    client_reference_id: user.id,
    // Stamped on the subscription too, so renewal and cancellation events
    // can be matched to the member without a lookup.
    subscription_data: { metadata: { supabase_user_id: user.id } },
    allow_promotion_codes: true,
    success_url: `${base}/membership?status=success`,
    cancel_url: `${base}/membership?status=cancelled`,
  });

  redirect(session.url ?? "/membership");
}

export async function openBillingPortal() {
  if (!isMembershipConfigured) redirect("/membership");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/membership");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.stripe_customer_id) redirect("/membership");

  const portal = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${await origin()}/membership`,
  });
  redirect(portal.url);
}
