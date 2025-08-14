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
      // Laisser en warning pour qu'il apparaisse dans l'éditeur,
      // mais ne bloque pas forcément le build
      "react/no-unescaped-entities": "error",
    },
  },
];

export default eslintConfig;
