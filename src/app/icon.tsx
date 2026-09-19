import { ImageResponse } from "next/og";
import { brandIconDataUrl } from "@/lib/brand-icon";

/** Browser-tab icon. Replaces the default Next.js favicon. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brandIconDataUrl()} width={64} height={64} alt="" />,
    size,
  );
}
