import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurahIndex } from "@/lib/quran";
import LessonEditor from "@/components/admin/LessonEditor";

export default async function AdminLessonPage({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  const n = Number(surah);
  const meta = (await getSurahIndex()).find((s) => s.number === n);
  if (!meta) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/lessons" className="font-body text-muted hover:text-parchment text-xs">
        ← All lessons
      </Link>
      <h2 className="font-display text-gold-light mt-3 text-2xl">
        {meta.number}. {meta.name}
      </h2>
      <p className="font-body text-muted text-sm">
        {meta.meaning} · {meta.ayahs} verses ·{" "}
        <Link href={`/quran/${meta.number}`} className="underline underline-offset-4">
          open in reader
        </Link>
      </p>
      <div className="mt-6">
        <LessonEditor surah={meta.number} />
      </div>
    </div>
  );
}
