import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that touch native bindings or spawn their own subprocess.
  // Without this, Turbopack's server build "externalizes" them behind a
  // content-hashed alias (e.g. `better-sqlite3-<hash>`) resolved via a
  // symlink generated at .next/node_modules/<hash> — a nested node_modules
  // that electron-builder's file copying silently drops when packaging,
  // breaking the app at runtime with "Cannot find module '<hash>'". Listing
  // them here makes Next require() them by their real package name instead,
  // resolved through the ordinary (real, non-symlinked) node_modules tree
  // we already bundle.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "@anthropic-ai/claude-agent-sdk",
  ],
};

export default nextConfig;
