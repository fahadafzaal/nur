import { ImageResponse } from "next/og";
import { brandIconDataUrl } from "@/lib/brand-icon";

/**
 * PNG app icons for the web app manifest, generated once at build time.
 *   /icons/192  /icons/512            — standard
 *   /icons/maskable-512               — artwork inside Android's safe zone
 */
const VARIANTS = {
  "192": { size: 192, inset: 0 },
  "512": { size: 512, inset: 0 },
  "maskable-512": { size: 512, inset: 0.22 },
} as const;

type Variant = keyof typeof VARIANTS;

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const v = VARIANTS[variant as Variant];
  if (!v) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brandIconDataUrl(v.inset)} width={v.size} height={v.size} alt="" />
    ),
    { width: v.size, height: v.size },
  );
}
