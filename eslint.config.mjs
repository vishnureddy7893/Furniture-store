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
    /**
     * These render images the customer just supplied, as inline `data:` URLs
     * held in memory. `next/image` cannot optimise a data URL — it would only
     * add a wrapper and a layout constraint around bytes that are already in the
     * page — and the studio preview additionally needs an element whose
     * intrinsic size it can line a canvas up against. A plain `<img>` is the
     * correct element here, so the rule is turned off for these files rather
     * than silenced line by line.
     */
    files: [
      "components/configurator/DesignPreview.tsx",
      "components/configurator/RequestConfirmation.tsx",
      "components/configurator/steps/InspirationStep.tsx",
      "components/configurator/steps/DetailSteps.tsx",
      "components/admin/RequestDetail.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
