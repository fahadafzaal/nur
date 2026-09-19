import { CartProvider } from "@/components/shop/CartProvider";
import ShopHeader from "@/components/shop/ShopHeader";

export default function ShopLayout({ children }: LayoutProps<"/shop">) {
  return (
    <CartProvider>
      <div className="mx-auto w-full max-w-5xl px-5 pt-8 pb-44 sm:px-6">
        <ShopHeader />
        <div className="mt-8">{children}</div>
      </div>
    </CartProvider>
  );
}
