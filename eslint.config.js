import js from "@eslint/js"
import globals from "globals"
import { defineConfig } from "eslint/config"

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    rules: {
      semi: ["error", "never"],
      indent: ["error", 2],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "no-unused-vars": 1,
      "no-return-assign": 0,
      "multiline-ternary": 0,
      "object-curly-spacing": 0,
      "object-property-newline": 0,
      "object-curly-newline": 0,
      quotes: 0,
      "quote-props": 0,
      "import/no-absolute-path": 0,
    },
  },
])
