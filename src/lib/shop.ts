import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaUrl } from "@/lib/media";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePence: number;
  currency: string;
  images: string[];
  sizes: string[];
  /** null = stock not tracked */
  stock: number | null;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_pence: number;
  currency: string;
  images: string[];
  sizes: string[];
  stock: number | null;
};

const COLUMNS = "id, slug, name, description, price_pence, currency, images, sizes, stock";

function toProduct(r: Row): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    pricePence: r.price_pence,
    currency: r.currency,
    images: (r.images ?? []).map((p) => mediaUrl(p)).filter((u): u is string => Boolean(u)),
    sizes: r.sizes ?? [],
    stock: r.stock,
  };
}

export async function getProducts(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("active", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => toProduct(r as Row));
}

export async function getProductBySlug(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data ? toProduct(data as Row) : null;
}
