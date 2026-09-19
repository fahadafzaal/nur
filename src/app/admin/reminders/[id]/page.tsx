import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { REMINDERS } from "@/lib/reminders";
import ReminderEditor from "@/components/admin/ReminderEditor";

export default async function AdminReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reminder = REMINDERS[Number(id) - 1];
  if (!reminder) notFound();

  const supabase = await createClient();
  const { data: nasheeds } = await supabase
    .from("nasheeds")
    .select("id, title, themes, published")
    .order("title");

  return (
    <div className="max-w-2xl">
      <Link href="/admin/reminders" className="font-body text-muted hover:text-parchment text-xs">
        ← All reminders
      </Link>
      <blockquote className="border-gold/20 font-display text-parchment mt-4 rounded-2xl border px-5 py-4 text-lg leading-relaxed">
        {reminder.text}
        <span className="font-body text-muted mt-2 block text-xs capitalize not-italic">
          Reminder {reminder.id} · theme: {reminder.theme}
        </span>
      </blockquote>
      <div className="mt-6">
        <ReminderEditor
          reminderId={reminder.id}
          theme={reminder.theme}
          nasheeds={(nasheeds ?? []).map((n) => ({
            id: n.id as string,
            title: n.title as string,
            published: n.published as boolean,
            matchesTheme: ((n.themes as string[]) ?? []).includes(reminder.theme),
          }))}
        />
      </div>
    </div>
  );
}
