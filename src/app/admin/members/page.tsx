import { createClient } from "@/lib/supabase/server";
import MemberList, { type Member } from "@/components/admin/MemberList";

export default async function AdminMembers() {
  const supabase = await createClient();
  const [{ data, error }, {
    data: { user },
  }] = await Promise.all([supabase.rpc("admin_list_members"), supabase.auth.getUser()]);

  if (error) {
    return <p className="font-body text-rose text-sm">Couldn&apos;t load members: {error.message}</p>;
  }

  return (
    <div>
      <p className="font-body text-muted text-sm leading-relaxed">
        Paid memberships switch on automatically through Stripe. Here you can
        also grant one by hand — for a gift, a reviewer, or family — and make
        someone an admin so they can manage content.
      </p>
      <div className="mt-5">
        <MemberList members={(data ?? []) as Member[]} selfId={user?.id ?? ""} />
      </div>
    </div>
  );
}
