import Link from "next/link";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== "new" && !UUID.test(id)) notFound();
  return (
    <div className="max-w-2xl">
      <Link href="/admin/shop" className="font-body text-muted hover:text-parchment text-xs">
        ← All products
      </Link>
      <h2 className="font-display text-gold-light mt-3 text-2xl">{id === "new" ? "New product" : "Edit product"}</h2>
      <div className="mt-6">
        <ProductEditor id={id === "new" ? null : id} />
      </div>
    </div>
  );
}
