import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: other lockfiles exist further up the filesystem,
  // and without this Turbopack picks one of those as the project root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
