"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, SaveButton, inputClass } from "./ui";

type Option = { id: string; title: string; published: boolean; matchesTheme: boolean };

export default function ReminderEditor({
  reminderId,
  theme,
  nasheeds,
}: {
  reminderId: number;
  theme: string;
  nasheeds: Option[];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [nasheedId, setNasheedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    createClient()
      .from("reminder_articles")
      .select("title, body, nasheed_id")
      .eq("reminder_id", reminderId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setBody(data.body);
          setNasheedId(data.nasheed_id ?? "");
        }
        setLoading(false);
      });
  }, [reminderId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const { error } = await createClient()
      .from("reminder_articles")
      .upsert(
        { reminder_id: reminderId, title: title.trim(), body, nasheed_id: nasheedId || null },
        { onConflict: "reminder_id" },
      );
    setSaving(false);
    setResult(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Saved — live now." });
  }

  const automatic = nasheeds.find((n) => n.published && n.matchesTheme);

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Field label="Reflection title" hint="Optional">
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} className={inputClass} />
      </Field>
      <Field label="Reflection" hint="Plain text. Leave a blank line between paragraphs.">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={loading}
          rows={12}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </Field>
      <Field
        label="Paired nasheed"
        hint={
          automatic
            ? `Left on automatic, this plays "${automatic.title}" (tagged "${theme}").`
            : `Left on automatic, nothing plays until a nasheed is tagged "${theme}".`
        }
      >
        <select
          value={nasheedId}
          onChange={(e) => setNasheedId(e.target.value)}
          disabled={loading}
          className={inputClass}
        >
          <option value="">Automatic — by theme</option>
          {nasheeds.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
              {n.published ? "" : " (draft)"}
              {n.matchesTheme ? ` · ${theme}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-center gap-4">
        <SaveButton saving={saving} disabled={loading} />
        {result ? <Notice tone={result.tone}>{result.text}</Notice> : null}
      </div>
    </form>
  );
}
