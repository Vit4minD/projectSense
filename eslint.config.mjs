import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Downgraded from error to warn: this rule fires on our SSR-safe
      // "hydrate client state from localStorage / load data on mount" effects
      // (useTweaks, useZetamac, room/leaderboard/profile data loads), which are
      // the correct pattern for client-only state in the App Router. Kept as a
      // warning so genuinely-avoidable cases stay visible.
      "react-hooks/set-state-in-effect": "warn",
      // Allow the underscore-prefix convention for intentionally-unused
      // bindings (e.g. `const { form: _form, ...rest } = item` to omit a key).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
