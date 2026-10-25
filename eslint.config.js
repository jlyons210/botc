import eslintJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintSecurity from "eslint-plugin-security";
import eslintTsdoc from "eslint-plugin-tsdoc";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
  },
  eslintJs.configs.recommended,
  tseslint.configs.recommended,
  eslintSecurity.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: { tsdoc: eslintTsdoc },
    rules: { "tsdoc/syntax": "warn" },
  },
  eslintConfigPrettier,
]);
