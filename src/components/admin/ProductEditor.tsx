"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/media";
import { formatMoney, parseMoney, slugify } from "@/lib/money";
import FileUpload from "./FileUpload";
import { Card, Field, Notice, SaveButton, Toggle, inputClass } from "./ui";

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One size"];

type Form = {
  name: string;
  slug: string;
  description: string;
  price: string;
  images: string[];
  sizes: string[];
  stock: string;
  active: boolean;
  sort_order: number;
};

export default function ProductEditor({ id }: { id: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    name: "",
    slug: "",
    description: "",
    price: "",
    images: [],
    sizes: [],
    stock: "",
    active: false,
    sort_order: 0,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!id) return;
    createClient()
      .from("products")
      .select("name, slug, description, price_pence, images, sizes, stock, active, sort_order")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name,
            slug: data.slug,
            description: data.description,
            price: (data.price_pence / 100).toFixed(2),
            images: data.images ?? [],
            sizes: data.sizes ?? [],
            stock: data.stock === null ? "" : String(data.stock),
            active: data.active,
            sort_order: data.sort_order,
          });
        }
        setLoading(false);
      });
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = parseMoney(form.price);
    const slug = slugify(form.slug || form.name);
    if (!form.name.trim()) return setResult({ tone: "error", text: "A name is required." });
    if (price === null) return setResult({ tone: "error", text: "Enter the price like 24.99" });
    if (!slug) return setResult({ tone: "error", text: "The web address can't be empty." });
    const stock = form.stock.trim() === "" ? null : Number.parseInt(form.stock, 10);
    if (stock !== null && (!Number.isFinite(stock) || stock < 0)) {
      return setResult({ tone: "error", text: "Stock must be a whole number, or blank to not track it." });
    }

    setSaving(true);
    setResult(null);
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description,
      price_pence: price,
      images: form.images,
      sizes: form.sizes,
      stock,
      active: form.active,
      sort_order: form.sort_order,
    };
    const supabase = createClient();
    if (id) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      setSaving(false);
      setResult(
        error
          ? { tone: "error", text: error.code === "23505" ? "Another product already uses that web address." : error.message }
          : { tone: "ok", text: "Saved." },
      );
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      setSaving(false);
      if (error || !data) {
        setResult({ tone: "error", text: error?.code === "23505" ? "Another product already uses that web address." : error?.message ?? "Couldn't create it." });
        return;
      }
      router.replace(`/admin/shop/${data.id}`);
    }
  }

  async function removeImage(path: string) {
    set("images", form.images.filter((p) => p !== path));
    await createClient().storage.from("media").remove([path]);
  }

  async function remove() {
    if (!id || !confirm(`Delete "${form.name}"? Past orders keep their record of it.`)) return;
    const supabase = createClient();
    if (form.images.length) await supabase.storage.from("media").remove(form.images);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return setResult({ tone: "error", text: error.message });
    router.replace("/admin/shop");
    router.refresh();
  }

  const price = parseMoney(form.price);

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            disabled={loading}
            className={inputClass}
          />
        </Field>
        <Field label="Web address" hint={`nur…/shop/${slugify(form.slug || form.name) || "…"}`}>
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            disabled={loading}
            className={inputClass}
          />
        </Field>
        <Field label="Description" hint="Fabric, fit, care — plain text, blank line between paragraphs.">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} disabled={loading} rows={6} className={`${inputClass} resize-y`} />
        </Field>
        <Field label="Price (£)" hint={price !== null ? formatMoney(price) : "e.g. 24.99"}>
          <input value={form.price} onChange={(e) => set("price", e.target.value)} disabled={loading} inputMode="decimal" className={`${inputClass} max-w-40`} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="font-body text-muted text-xs tracking-wide">Photos — the first is the main image</p>
        {form.images.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {form.images.map((path, i) => (
              <li key={path} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(path) ?? ""} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  {i > 0 ? (
                    <button
                      type="button"
                      onClick={() => set("images", [path, ...form.images.filter((p) => p !== path)])}
                      className="bg-ink/80 text-gold-light rounded px-1.5 text-[10px]"
                    >
                      Main
                    </button>
                  ) : <span />}
                  <button type="button" onClick={() => void removeImage(path)} className="bg-ink/80 text-rose rounded px-1.5 text-[10px]">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <FileUpload
          bucket="media"
          folder="products"
          accept="image/jpeg,image/png,image/webp"
          label="Add a photo"
          onUploaded={(path) => setForm((f) => ({ ...f, images: [...f.images, path] }))}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <Field label="Sizes" hint="Leave all off for a one-size item.">
          <div className="flex flex-wrap gap-1.5">
            {SIZE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={form.sizes.includes(s)}
                onClick={() =>
                  set("sizes", form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : SIZE_SUGGESTIONS.filter((x) => x === s || form.sizes.includes(x)))
                }
                className={`font-body rounded-full border px-3 py-1 text-xs transition ${
                  form.sizes.includes(s) ? "border-gold/60 bg-gold/10 text-gold-light" : "text-muted border-white/10"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Stock" hint="Blank = don't track. Sold-out items can't be ordered.">
          <input value={form.stock} onChange={(e) => set("stock", e.target.value)} inputMode="numeric" className={`${inputClass} max-w-32`} />
        </Field>
        <Field label="Order" hint="Lower numbers appear first">
          <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} className={`${inputClass} max-w-32`} />
        </Field>
        <Toggle checked={form.active} onChange={(v) => set("active", v)} label="Live in the shop" />
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
