import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductBySlug } from "@/lib/shop";
import { formatMoney } from "@/lib/money";
import ProductGallery from "@/components/shop/ProductGallery";
import AddToCart from "@/components/shop/AddToCart";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const p = await getProductBySlug(supabase, slug);
  return { title: p ? `${p.name} — NUR Shop` : "Shop — NUR" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const product = await getProductBySlug(supabase, slug);
  if (!product) notFound();

  const paragraphs = product.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <Link href="/shop" className="font-body text-muted hover:text-parchment text-xs">
        ← All products
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <h1 className="font-display text-parchment text-3xl">{product.name}</h1>
          <p className="font-body text-gold-light mt-2 text-xl">{formatMoney(product.pricePence, product.currency)}</p>
          <div className="mt-6">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                pricePence: product.pricePence,
                currency: product.currency,
                image: product.images[0] ?? null,
                sizes: product.sizes,
                stock: product.stock,
              }}
            />
          </div>
          {paragraphs.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3">
              {paragraphs.map((p, i) => (
                <p key={i} className="font-body text-muted text-sm leading-relaxed whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
