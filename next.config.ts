import type { NextConfig } from "next";

// Browser protections on every response. The site is never shown inside another site's frame
// (stops click-jacking of the admin), browsers must trust our content types, and other sites only
// learn our origin, never the full page address, when a visitor follows a link out.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Only our own Supabase project may serve photos through the image optimiser.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Czech pages say so in the response too (Bing and Seznam read Content-Language).
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/cs", headers: [{ key: "Content-Language", value: "cs" }] },
      { source: "/cs/:path*", headers: [{ key: "Content-Language", value: "cs" }] },
    ];
  },
  // The join form moved to /join, the page people search for ("play cricket in Prague").
  async redirects() {
    return [
      // One address for search engines: www forwards to the bare domain, keeping the path.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.praguespartanscc.com" }],
        destination: "https://praguespartanscc.com/:path*",
        permanent: true,
      },
      { source: "/contact", destination: "/join", permanent: true },
      { source: "/cs/contact", destination: "/cs/join", permanent: true },
      // Account pages exist in English only.
      { source: "/cs/login", destination: "/login", permanent: false },
      { source: "/cs/signup", destination: "/signup", permanent: false },
      { source: "/cs/reset-password", destination: "/reset-password", permanent: false },
      { source: "/cs/dashboard", destination: "/dashboard", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      // Club photos and sponsor logos in our Supabase Storage
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
      // Gallery photos served from Google Drive (photoUrl in src/lib/photos.ts)
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/d/**" },
      // YouTube video thumbnails
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
