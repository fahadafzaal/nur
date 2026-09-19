import { ImageResponse } from "next/og";
import { brandIconDataUrl } from "@/lib/brand-icon";

/** iPhone/iPad home-screen icon ("Add to Home Screen" in Safari). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brandIconDataUrl(0.08)} width={180} height={180} alt="" />,
    size,
  );
}
