import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain CommonJS Node script outside the Next app — Electron's main
    // process — require() is correct here.
    "electron/**",
    // electron-builder output (copies of node_modules, .next, etc).
    "release/**",
    // Separate Next.js app with its own eslint config — not part of this one.
    "lp/**",
  ]),
]);

export default eslintConfig;
