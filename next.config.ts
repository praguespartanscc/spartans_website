import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Czech pages say so in the response too (Bing and Seznam read Content-Language).
  async headers() {
    return [
      { source: "/cs", headers: [{ key: "Content-Language", value: "cs" }] },
      { source: "/cs/:path*", headers: [{ key: "Content-Language", value: "cs" }] },
    ];
  },
  // The join form moved to /join, the page people search for ("play cricket in Prague").
  async redirects() {
    return [
      { source: "/contact", destination: "/join", permanent: true },
      { source: "/cs/contact", destination: "/cs/join", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      // Club photos and sponsor logos in Supabase Storage
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Gallery photos served from Google Drive
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      // YouTube video thumbnails
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.ytimg.com" },
    ],
  },
};

export default nextConfig;
