import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

// Architecture boundaries (ADR-001): modules may not reach into other modules.
// Cross-module collaboration will go through public module APIs or events (Phase 03).
const boundaryElements = [
  { type: "app", pattern: "src/app" },
  { type: "module", pattern: "src/modules/*", capture: ["moduleName"] },
  { type: "platform", pattern: "src/platform/*", capture: ["platformPart"] },
  // Vendored COSS UI layer, managed by the shadcn CLI (`@coss/*`). Do not edit by hand.
  { type: "coss-ui", pattern: "src/components" },
  { type: "coss-support", pattern: "src/{lib,hooks}" },
];

const cossLayers = ["coss-ui", "coss-support"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": boundaryElements,
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          message:
            "{{from.element.types}} is not allowed to depend on {{to.element.types}} (ADR-001 module boundaries)",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: { element: { types: { anyOf: ["app", "module", "platform", ...cossLayers] } } },
              },
            },
            {
              from: { element: { type: "module" } },
              allow: {
                to: [
                  {
                    element: {
                      type: "module",
                      captured: { moduleName: "{{from.element.captured.moduleName}}" },
                    },
                  },
                  { element: { types: { anyOf: ["platform", ...cossLayers] } } },
                ],
              },
            },
            {
              from: { element: { type: "platform" } },
              allow: { to: { element: { types: { anyOf: ["platform", ...cossLayers] } } } },
            },
            {
              from: { element: { types: { anyOf: cossLayers } } },
              allow: { to: { element: { types: { anyOf: cossLayers } } } },
            },
          ],
        },
      ],
    },
  },
  {
    // Vendored COSS sidebar skeleton uses Math.random for a decorative width.
    // Kept unmodified so COSS updates can be pulled without merge conflicts.
    files: ["src/components/ui/sidebar.tsx"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project documentation and AI tooling are not application code.
    ".claude/**",
    ".agents/**",
    "ai/**",
    "docs/**",
  ]),
]);

export default eslintConfig;
