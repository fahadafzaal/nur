"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDuration, mediaUrl } from "@/lib/media";
import FileUpload from "./FileUpload";
import { Card, Field, Notice, SaveButton, inputClass } from "./ui";

/** "1:08" → 68; "68" → 68. */
function parseTime(s: string) {
  const t = s.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(\d+):([0-5]\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export default function SettingsEditor() {
  const [path, setPath] = useState<string | null>(null);
  const [title, setTitle] = useState("Lost and Found");
  const [start, setStart] = useState("1:08");
  const [end, setEnd] = useState("1:53");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    createClient()
      .from("app_settings")
      .select("ambient_path, ambient_title, ambient_start, ambient_end")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPath(data.ambient_path);
          setTitle(data.ambient_title);
          setStart(formatDuration(data.ambient_start) || "0:00");
          setEnd(formatDuration(data.ambient_end));
        }
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const s = parseTime(start);
    const en = parseTime(end);
    if (s === null || en === null) return setResult({ tone: "error", text: "Write times like 1:08" });
    if (en <= s) return setResult({ tone: "error", text: "The loop has to end after it starts." });
    setSaving(true);
    setResult(null);
    const { error } = await createClient()
      .from("app_settings")
      .update({ ambient_path: path, ambient_title: title.trim() || "Ambient", ambient_start: s, ambient_end: en })
      .eq("id", 1);
    setSaving(false);
    setResult(
      error
        ? { tone: "error", text: error.message }
        : { tone: "ok", text: "Saved — visitors hear it from their next visit." },
    );
  }

  function previewLoop() {
    const a = previewRef.current;
    const s = parseTime(start);
    const en = parseTime(end);
    if (!a || s === null || en === null) return;
    a.currentTime = s;
    void a.play();
    const stopAt = () => {
      if (a.currentTime >= en) {
        a.pause();
        a.removeEventListener("timeupdate", stopAt);
      }
    };
    a.addEventListener("timeupdate", stopAt);
  }

  const url = mediaUrl(path);

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <FileUpload
          bucket="media"
          folder="ambient"
          accept="audio/*"
          label="Track"
          current={path}
          onUploaded={(p) => setPath(p)}
        />
        <Field label="Title" hint="Shown when someone hovers the sound button">
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loop starts at">
            <input value={start} onChange={(e) => setStart(e.target.value)} disabled={loading} placeholder="1:08" className={inputClass} />
          </Field>
          <Field label="Loop ends at">
            <input value={end} onChange={(e) => setEnd(e.target.value)} disabled={loading} placeholder="1:53" className={inputClass} />
          </Field>
        </div>
        {url ? (
          <div className="flex items-center gap-3">
            <audio ref={previewRef} src={url} preload="metadata" />
            <button type="button" onClick={previewLoop} className="nur-btn-secondary font-body rounded-full px-4 py-1.5 text-xs">
              ▶ Hear the loop
            </button>
            <button type="button" onClick={() => previewRef.current?.pause()} className="font-body text-muted text-xs">
              Stop
            </button>
          </div>
        ) : null}
      </Card>
      <div className="flex items-center gap-4">
        <SaveButton saving={saving} disabled={loading} />
        {result ? <Notice tone={result.tone}>{result.text}</Notice> : null}
      </div>
    </form>
  );
}
