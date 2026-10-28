import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Club photos and sponsor logos in Supabase Storage
      { protocol: "https", hostname: "vdljjrlsyrxbchznmbgi.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Gallery photos served from Google Drive
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
};

export default nextConfig;
