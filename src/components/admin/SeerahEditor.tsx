"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TRAITS, type TraitSlug } from "@/lib/seerah";
import { formatDuration } from "@/lib/media";
import FileUpload from "./FileUpload";
import { Card, Field, Notice, SaveButton, Toggle, inputClass } from "./ui";

type Form = {
  trait: TraitSlug;
  title: string;
  summary: string;
  story: string;
  audio_path: string | null;
  duration_s: number | null;
  is_member_only: boolean;
  sort_order: number;
  published: boolean;
};

export default function SeerahEditor({
  id,
  initialTrait,
}: {
  id: string | null;
  initialTrait: TraitSlug;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    trait: initialTrait,
    title: "",
    summary: "",
    story: "",
    audio_path: null,
    duration_s: null,
    is_member_only: true,
    sort_order: 0,
    published: false,
  });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!id) return;
    createClient()
      .from("seerah_episodes")
      .select("trait, title, summary, story, audio_path, duration_s, is_member_only, sort_order, published")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(data as Form);
        setLoading(false);
      });
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setResult({ tone: "error", text: "A title is required." });
      return;
    }
    setSaving(true);
    setResult(null);
    const supabase = createClient();
    const payload = { ...form, title: form.title.trim() };
    if (id) {
      const { error } = await supabase.from("seerah_episodes").update(payload).eq("id", id);
      setSaving(false);
      setResult(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Saved." });
    } else {
      const { data, error } = await supabase.from("seerah_episodes").insert(payload).select("id").single();
      setSaving(false);
      if (error || !data) {
        setResult({ tone: "error", text: error?.message ?? "Couldn't create it." });
        return;
      }
      router.replace(`/admin/seerah/${data.id}`);
    }
  }

  async function remove() {
    if (!id || !confirm(`Delete "${form.title}"? Members' reflections on it are deleted too.`)) return;
    const supabase = createClient();
    if (form.audio_path) await supabase.storage.from("nasheeds").remove([form.audio_path]);
    const { error } = await supabase.from("seerah_episodes").delete().eq("id", id);
    if (error) {
      setResult({ tone: "error", text: error.message });
      return;
    }
    router.replace("/admin/seerah");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <Field label="Quality">
          <select
            value={form.trait}
            onChange={(e) => set("trait", e.target.value as TraitSlug)}
            disabled={loading}
            className={inputClass}
          >
            {TRAITS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} — {t.translit}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input value={form.title} onChange={(e) => set("title", e.target.value)} disabled={loading} className={inputClass} />
        </Field>
        <Field label="Summary" hint="One or two sentences — shown to everyone, including non-members.">
          <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} disabled={loading} rows={2} className={`${inputClass} resize-y`} />
        </Field>
        <Field label="Story" hint="Plain text. Leave a blank line between paragraphs.">
          <textarea value={form.story} onChange={(e) => set("story", e.target.value)} disabled={loading} rows={16} className={`${inputClass} resize-y leading-relaxed`} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <FileUpload
          bucket="nasheeds"
          folder="seerah"
          accept="audio/*"
          label="Narration (private — optional)"
          current={form.audio_path}
          onUploaded={(path, { durationS }) =>
            setForm((f) => ({ ...f, audio_path: path, duration_s: durationS ?? f.duration_s }))
          }
        />
        {form.duration_s ? (
          <p className="font-body text-muted text-[11px]">Length: {formatDuration(form.duration_s)}</p>
        ) : null}
        <Field label="Order within this quality" hint="Lower numbers come first">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
            className={`${inputClass} max-w-32`}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <Toggle checked={form.is_member_only} onChange={(v) => set("is_member_only", v)} label="Members only" hint="Off makes the story and narration free." />
        <Toggle checked={form.published} onChange={(v) => set("published", v)} label="Published" />
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <SaveButton saving={saving} disabled={loading} label={id ? "Save" : "Create"} />
        {id ? (
          <button type="button" onClick={remove} className="font-body text-rose/80 hover:text-rose text-xs">
            Delete
          </button>
        ) : null}
        {result ? <Notice tone={result.tone}>{result.text}</Notice> : null}
      </div>
    </form>
  );
}
