import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives nested inside the claude-manager repo, which has its own
  // lockfile — pin the workspace root to this folder so Next/Turbopack
  // doesn't try to infer it from the parent's package-lock.json.
  turbopack: {
    root: path.join(__dirname),
  },
  // Served as a GitHub Pages project site at /claude-manager/, so it needs a
  // static export and every asset URL prefixed with the repo name.
  output: "export",
  basePath: "/claude-manager",
};

export default nextConfig;
