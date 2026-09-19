"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Bucket = "nasheeds" | "media";

/**
 * Uploads one file straight from the admin's browser to Supabase Storage.
 * The storage policies only accept writes from admins, so this needs no
 * server route. For audio it also reads the duration from the file, so the
 * client never has to type it.
 */
export default function FileUpload({
  bucket,
  folder,
  accept,
  label,
  current,
  onUploaded,
}: {
  bucket: Bucket;
  folder: string;
  accept: string;
  label: string;
  /** The currently stored path, if any. */
  current?: string | null;
  onUploaded: (path: string, meta: { durationS: number | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function audioDuration(file: File) {
    if (!file.type.startsWith("audio/")) return null;
    return new Promise<number | null>((resolve) => {
      const url = URL.createObjectURL(file);
      const probe = new Audio();
      probe.preload = "metadata";
      probe.onloadedmetadata = () => {
        const d = Number.isFinite(probe.duration) ? Math.round(probe.duration) : null;
        URL.revokeObjectURL(url);
        resolve(d && d > 0 ? d : null);
      };
      probe.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      probe.src = url;
    });
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setState("error");
      setMessage("That file is over 50 MB — please export a smaller version.");
      return;
    }

    setState("uploading");
    setMessage(null);

    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
    const base = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
    // A timestamp keeps re-uploads from colliding with (or being cached as) old files.
    const path = `${folder}/${Date.now()}-${base}.${ext}`;

    const [durationS, { error }] = await Promise.all([
      audioDuration(file),
      createClient().storage.from(bucket).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      }),
    ]);

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("done");
    setMessage(`Uploaded ${file.name}`);
    onUploaded(path, { durationS });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-dashed border-white/15 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-parchment text-sm">{label}</p>
          <p className="font-body text-muted/70 truncate text-[11px]">
            {current ? current.split("/").pop() : "Nothing uploaded yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state === "uploading"}
          className="nur-btn-secondary font-body rounded-full px-4 py-1.5 text-xs disabled:opacity-50"
        >
          {state === "uploading" ? "Uploading…" : current ? "Replace" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
      </div>
      {message ? (
        <p className={`font-body mt-2 text-[11px] ${state === "error" ? "text-rose" : "text-gold-light"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
