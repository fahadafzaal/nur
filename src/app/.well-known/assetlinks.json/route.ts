/**
 * Digital Asset Links — proves to Android that the Google Play version of
 * NUR (a Trusted Web Activity) and this website belong together, so the app
 * opens full screen with no browser bar.
 *
 * Set in Vercel once the Play package is generated (e.g. with PWABuilder):
 *   ANDROID_PACKAGE_NAME   e.g. com.mynuralanur.app
 *   ANDROID_SHA256         the signing certificate fingerprint, AA:BB:…
 *                          (several may be comma-separated)
 * Until then this returns an empty list, which is harmless.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME;
  const prints = (process.env.ANDROID_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const body =
    pkg && prints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints },
          },
        ]
      : [];

  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
