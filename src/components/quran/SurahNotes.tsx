"use client";

import PrivateJournal from "@/components/PrivateJournal";

/** My Notes — "a little like Qur'an journaling but electronic." */
export default function SurahNotes({
  surah,
  name,
}: {
  surah: number;
  name: string;
}) {
  return (
    <PrivateJournal
      table="quran_notes"
      keys={{ surah_no: surah }}
      title={`Reflections on ${name}`}
      placeholder={`What stayed with you in ${name}? A verse, a question, a du'a…`}
      label={`Your notes on ${name}`}
    />
  );
}
