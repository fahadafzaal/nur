import Link from "next/link";
import { notFound } from "next/navigation";
import { REMINDERS } from "@/lib/reminders";
import NasheedEditor from "@/components/admin/NasheedEditor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminNasheedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== "new" && !UUID.test(id)) notFound();

  // Tagging with these makes reminder pairing automatic.
  const themes = [...new Set(REMINDERS.map((r) => r.theme))].sort();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/nasheeds" className="font-body text-muted hover:text-parchment text-xs">
        ← All nasheeds
      </Link>
      <h2 className="font-display text-gold-light mt-3 text-2xl">
        {id === "new" ? "New nasheed" : "Edit nasheed"}
      </h2>
      <div className="mt-6">
        <NasheedEditor id={id === "new" ? null : id} themeSuggestions={themes} />
      </div>
    </div>
  );
}
