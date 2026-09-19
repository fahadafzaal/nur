"use client";

import { useFormStatus } from "react-dom";
import { openBillingPortal, startMembershipCheckout } from "@/lib/stripe/membership";

function Submit({ label, pendingLabel, primary }: { label: string; pendingLabel: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primary ? "nur-btn-primary font-semibold" : "nur-btn-secondary"} font-body w-full rounded-full px-8 py-3.5 text-sm tracking-wide disabled:opacity-60`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * The membership call to action. When payments are not configured yet it
 * says so plainly instead of offering a button that fails.
 */
export default function MembershipActions({
  mode,
  enabled,
}: {
  mode: "join" | "manage";
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <p className="border-gold/20 bg-gold/[0.04] font-body text-muted mx-auto max-w-sm rounded-2xl border px-5 py-4 text-center text-sm leading-relaxed">
        Paid membership opens soon, in sha Allah. Your free account already
        includes the Qur&apos;an Explorer, reminders, tasbeeh and health log.
      </p>
    );
  }

  return (
    <form action={mode === "join" ? startMembershipCheckout : openBillingPortal} className="mx-auto mt-4 max-w-xs">
      {mode === "join" ? (
        <Submit label="Become a Member" pendingLabel="Opening secure checkout…" primary />
      ) : (
        <Submit label="Manage membership" pendingLabel="Opening…" />
      )}
      {mode === "join" ? (
        <p className="font-body text-muted/60 mt-3 text-center text-[11px]">
          Secure payment by Stripe. Cancel anytime.
        </p>
      ) : null}
    </form>
  );
}
