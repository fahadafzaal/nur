import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin — NUR" };

/**
 * Every /admin page sits behind this check. It is a convenience, not the
 * security boundary: every table and bucket the admin panel writes to is
 * guarded by an is_admin() policy in the database, so a non-admin who
 * reached these pages still could not change anything.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-6 pt-24 pb-28 text-center">
        <h1 className="font-display text-gold-light text-2xl">Admins only</h1>
        <p className="font-body text-muted mt-3 text-sm leading-relaxed">
          This area is for managing NUR&apos;s content. If you should have
          access, ask an existing admin to grant it from the Members page.
        </p>
        <Link href="/home" className="nur-btn-secondary font-body mt-8 rounded-full px-6 py-2.5 text-xs">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-8 pb-40 sm:px-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-body text-gold/70 text-[10px] tracking-[0.24em] uppercase">NUR</p>
          <h1 className="font-display text-parchment text-2xl">Admin</h1>
        </div>
        <Link href="/home" className="font-body text-muted hover:text-parchment text-xs">
          View app →
        </Link>
      </header>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
