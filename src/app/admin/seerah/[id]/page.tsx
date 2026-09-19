import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrait } from "@/lib/seerah";
import SeerahEditor from "@/components/admin/SeerahEditor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminSeerahPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trait?: string }>;
}) {
  const [{ id }, { trait }] = await Promise.all([params, searchParams]);
  if (id !== "new" && !UUID.test(id)) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/seerah" className="font-body text-muted hover:text-parchment text-xs">
        ← All episodes
      </Link>
      <h2 className="font-display text-gold-light mt-3 text-2xl">
        {id === "new" ? "New episode" : "Edit episode"}
      </h2>
      <div className="mt-6">
        <SeerahEditor id={id === "new" ? null : id} initialTrait={getTrait(trait ?? "")?.slug ?? "mercy"} />
      </div>
    </div>
  );
}
