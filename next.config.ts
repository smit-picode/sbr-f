import type { NextConfig } from "next";

// The app is served under this path (https://<host>/sbr); hand-built URLs read it via NEXT_PUBLIC_BASE_PATH.
const basePath = "/sbr";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  reactStrictMode: true,
  poweredByHeader: false,
  // Bare-host URLs (old bookmarks, hosts that serve at the root) have no page; send them under the base path.
  async redirects() {
    return [
      { source: "/", destination: basePath, basePath: false, permanent: false },
      { source: "/:path((?!sbr(?:/|$)|_next/|api/).+)", destination: `${basePath}/:path`, basePath: false, permanent: false },
    ];
  },
};

export default nextConfig;
