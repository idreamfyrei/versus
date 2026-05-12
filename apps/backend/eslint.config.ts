// eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Define which files to lint
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Add custom rules or overrides here
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
  {
    // Ignore build artifacts and config files
    ignores: ["dist/", "node_modules/", "eslint.config.mjs"],
  },
];
