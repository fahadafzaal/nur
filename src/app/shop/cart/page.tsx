import { isStripeConfigured } from "@/lib/stripe/config";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import CartView from "@/components/shop/CartView";

export const metadata = { title: "Your bag — NUR Shop" };

export default function CartPage() {
  return (
    <>
      <h1 className="font-display text-parchment text-2xl">Your bag</h1>
      <div className="mt-6">
        <CartView checkoutEnabled={isStripeConfigured && isAdminClientConfigured} />
      </div>
    </>
  );
}
