import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable the 'no-unescaped-entities' rule for JSX
      "react/no-unescaped-entities": "off",
      
      // Disable the 'no-unused-vars' rule
      "@typescript-eslint/no-unused-vars": "off",

      // Disable the 'no-img-element' rule for <img> tags
      "@next/next/no-img-element": "off",

      // Disable 'no-explicit-any' rule for TypeScript
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
