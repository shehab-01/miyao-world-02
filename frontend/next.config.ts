import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
