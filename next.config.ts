import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  webpack: (config) => {
    // jsPDF optionally loads canvg for SVG rendering. FakeShield builds PDFs
    // from text and vector primitives only, so the optional dependency can be
    // stubbed instead of pulling a canvas renderer into the bundle.
    config.resolve.alias = { ...config.resolve.alias, canvg: false };
    return config;
  },
  async headers() {
    return [
      {
        // The backdrop media never changes within a release; cache it hard so
        // repeat visits skip the multi-megabyte download entirely.
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
