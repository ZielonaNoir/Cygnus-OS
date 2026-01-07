import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      // Default ignores:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Ignore CLI package (it has its own ESLint config)
      "packages/cygnus-cli/**",
      "packages/**/node_modules/**",
      "node_modules/**",
    ],
    rules: {
      // Disable Next.js pages directory check (we use App Router)
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
