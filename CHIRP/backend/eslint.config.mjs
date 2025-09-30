import eslintPluginImport from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  {
    ignores: ["dist", "node_modules"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {
      import: eslintPluginImport,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "import/no-unresolved": "error",
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
];
