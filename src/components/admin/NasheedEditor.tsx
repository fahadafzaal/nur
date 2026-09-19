"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/media";
import FileUpload from "./FileUpload";
import ThemePicker from "./ThemePicker";
import { Card, Field, Notice, SaveButton, Toggle, inputClass } from "./ui";

type Form = {
  title: string;
  artist: string;
  description: string;
  audio_path: string | null;
  preview_path: string | null;
  cover_path: string | null;
  duration_s: number | null;
  is_member_only: boolean;
  themes: string[];
  sort_order: number;
  published: boolean;
};

const EMPTY: Form = {
  title: "",
  artist: "",
  description: "",
  audio_path: null,
  preview_path: null,
  cover_path: null,
  duration_s: null,
  is_member_only: true,
  themes: [],
  sort_order: 0,
  published: false,
};

export default function NasheedEditor({
  id,
  themeSuggestions,
}: {
  id: string | null;
  themeSuggestions: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!id) return;
    createClient()
      .from("nasheeds")
      .select("title, artist, description, audio_path, preview_path, cover_path, duration_s, is_member_only, themes, sort_order, published")
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
    if (form.published && !form.audio_path && !form.preview_path) {
      setResult({ tone: "error", text: "Upload the audio (or at least a preview) before publishing." });
      return;
    }
    setSaving(true);
    setResult(null);
    const supabase = createClient();
    const payload = { ...form, title: form.title.trim(), artist: form.artist.trim() };

    if (id) {
      const { error } = await supabase.from("nasheeds").update(payload).eq("id", id);
      setSaving(false);
      setResult(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Saved." });
    } else {
      const { data, error } = await supabase.from("nasheeds").insert(payload).select("id").single();
      setSaving(false);
      if (error || !data) {
        setResult({ tone: "error", text: error?.message ?? "Couldn't create it." });
        return;
      }
      router.replace(`/admin/nasheeds/${data.id}`);
    }
  }

  async function remove() {
    if (!id || !confirm(`Delete "${form.title}"? This can't be undone.`)) return;
    const supabase = createClient();
    // Remove the files too, so nothing is left orphaned in storage.
    await Promise.all([
      form.audio_path ? supabase.storage.from("nasheeds").remove([form.audio_path]) : null,
      form.preview_path ? supabase.storage.from("media").remove([form.preview_path]) : null,
      form.cover_path ? supabase.storage.from("media").remove([form.cover_path]) : null,
    ]);
    const { error } = await supabase.from("nasheeds").delete().eq("id", id);
    if (error) {
      setResult({ tone: "error", text: error.message });
      return;
    }
    router.replace("/admin/nasheeds");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <Field label="Title">
          <input value={form.title} onChange={(e) => set("title", e.target.value)} disabled={loading} className={inputClass} />
        </Field>
        <Field label="Artist" hint="Optional">
          <input value={form.artist} onChange={(e) => set("artist", e.target.value)} disabled={loading} className={inputClass} />
        </Field>
        <Field label="Description" hint="Optional — shown under the track">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={loading}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="font-body text-muted text-xs tracking-wide">Files</p>
        <FileUpload
          bucket="nasheeds"
          folder="tracks"
          accept="audio/*"
          label="Full track (private — members only)"
          current={form.audio_path}
          onUploaded={(path, { durationS }) =>
            setForm((f) => ({ ...f, audio_path: path, duration_s: durationS ?? f.duration_s }))
          }
        />
        <FileUpload
          bucket="media"
          folder="previews"
          accept="audio/*"
          label="Preview clip (public — heard by non-members)"
          current={form.preview_path}
          onUploaded={(path) => set("preview_path", path)}
        />
        <FileUpload
          bucket="media"
          folder="covers"
          accept="image/jpeg,image/png,image/webp"
          label="Cover image (optional, square works best)"
          current={form.cover_path}
          onUploaded={(path) => set("cover_path", path)}
        />
        {form.duration_s ? (
          <p className="font-body text-muted text-[11px]">Length: {formatDuration(form.duration_s)} (read from the file)</p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4">
        <Field label="Themes" hint="Tagging a reminder theme pairs this nasheed with those reminders automatically.">
          <ThemePicker value={form.themes} onChange={(v) => set("themes", v)} suggestions={themeSuggestions} />
        </Field>
        <Field label="Order" hint="Lower numbers appear first">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
            className={`${inputClass} max-w-32`}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <Toggle
          checked={form.is_member_only}
          onChange={(v) => set("is_member_only", v)}
          label="Members only"
          hint="Off makes the full track free for every signed-in visitor."
        />
        <Toggle
          checked={form.published}
          onChange={(v) => set("published", v)}
          label="Published"
          hint="Off keeps it hidden from the library."
        />
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
