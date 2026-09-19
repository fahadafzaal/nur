"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SaveButton, Toggle, inputClass } from "./ui";

export default function LessonEditor({ surah }: { surah: number }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    createClient()
      .from("surah_lessons")
      .select("title, body, published")
      .eq("surah_no", surah)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setBody(data.body);
          setPublished(data.published);
        }
        setLoading(false);
      });
  }, [surah]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const { error } = await createClient()
      .from("surah_lessons")
      .upsert({ surah_no: surah, title: title.trim(), body, published }, { onConflict: "surah_no" });
    setSaving(false);
    setResult(
      error
        ? { tone: "error", text: error.message }
        : { tone: "ok", text: published ? "Saved and live for members." : "Saved as a draft." },
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Field label="Title" hint="Optional — e.g. 'The Opening: a conversation with Allah'">
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} className={inputClass} />
      </Field>
      <Field label="Lesson" hint="Plain text. Leave a blank line between paragraphs.">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={loading}
          rows={16}
          className={`${inputClass} font-body resize-y leading-relaxed`}
        />
      </Field>
      <Toggle
        checked={published}
        onChange={setPublished}
        label="Published"
        hint="Off keeps it as a draft only admins can see."
      />
      <div className="flex items-center gap-4">
        <SaveButton saving={saving} disabled={loading} />
        {result ? <Notice tone={result.tone}>{result.text}</Notice> : null}
      </div>
    </form>
  );
}
