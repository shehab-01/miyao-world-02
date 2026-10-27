import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // The /api rewrite cuts request bodies off at 10MB by default; the backend
    // accepts images up to 30MB (long detail images)
    proxyClientMaxBodySize: "40mb",
  },
  // The browser calls the API on the site's own origin, so the session cookie
  // is first-party and OAuth redirect URIs live on the site's domain.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL_INTERNAL ?? "http://localhost:8000"}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.API_URL_INTERNAL ?? "http://localhost:8000"}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
