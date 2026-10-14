import type { NextConfig } from "next";

// The app is served under this path (https://<host>/sbr); hand-built URLs read it via NEXT_PUBLIC_BASE_PATH.
const basePath = "/sbr";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  reactStrictMode: true,
  poweredByHeader: false,
  // Local dev only: the bare host has no page, so send it to the app.
  async redirects() {
    if (process.env.NODE_ENV !== "development") return [];
    return [{ source: "/", destination: basePath, basePath: false, permanent: false }];
  },
};

export default nextConfig;
