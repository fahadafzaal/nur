import "server-only";
import Stripe from "stripe";

/**
 * Stripe configuration. All server-only — none of these may ever be a
 * NEXT_PUBLIC_ variable.
 *
 *   STRIPE_SECRET_KEY            sk_live_… / sk_test_…
 *   STRIPE_WEBHOOK_SECRET        whsec_…   (from the webhook endpoint)
 *   STRIPE_MEMBERSHIP_PRICE_ID   price_…   (the recurring membership price)
 *
 * Until they are set, every payment surface shows "opens soon" instead of
 * failing — the rest of the app is unaffected.
 */
const SECRET = process.env.STRIPE_SECRET_KEY ?? "";

export const MEMBERSHIP_PRICE_ID = process.env.STRIPE_MEMBERSHIP_PRICE_ID ?? "";
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const isStripeConfigured = Boolean(SECRET);
export const isMembershipConfigured = Boolean(SECRET && MEMBERSHIP_PRICE_ID);

let client: Stripe | null = null;

export function getStripe() {
  if (!SECRET) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(SECRET);
  return client;
}

/** Countries the shop ships to. The client is UK-based. */
export const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["GB", "IE", "US", "CA", "AU", "NZ", "PK", "AE", "SA", "QA", "KW", "BH", "OM", "MY", "SG", "DE", "FR", "NL", "BE", "SE"];
