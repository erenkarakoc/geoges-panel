import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

import { loadModuleGraph } from "./scripts/module-graph.mjs";

// Architecture boundaries (ADR-001, MODULE_BOUNDARIES section 2, TASK-0099): a module may use
// another module only along an arrow of docs/architecture/MODULE_MAP.md and only through its
// `index.ts`. The allowed arrows are generated from the map, never written here by hand, and
// loading fails on a dependency cycle (validated by SPIKE-17).
const { policies: modulePolicies } = loadModuleGraph();
const boundaryElements = [
  { type: "app", pattern: "src/app" },
  { type: "module", pattern: "src/modules/*", capture: ["moduleName"] },
  { type: "platform", pattern: "src/platform/*", capture: ["platformPart"] },
  // Vendored COSS UI layer, managed by the shadcn CLI (`@coss/*`). Do not edit by hand.
  { type: "coss-ui", pattern: "src/components" },
  { type: "coss-support", pattern: "src/{lib,hooks}" },
  // Composition root of the event backbone (TASK-0104): collects modules' jobs for the worker.
  { type: "jobs", pattern: "src/jobs" },
  // Composition root of documents (TASK-0107): the storage adapter and each module's record
  // resolver, handed to DOC's service.
  { type: "records", pattern: "src/records" },
  // Development-only presentation sandbox (D-052): fully self-contained, removable as one folder.
  { type: "sandbox", pattern: "src/sandbox/*", capture: ["sandboxName"] },
];

const cossLayers = ["coss-ui", "coss-support"];

// Database access (TASK-0101): the driver and query builder stay behind src/platform/db.
const databaseImports = {
  paths: [{ name: "pg", message: "Only src/platform/db uses the driver (ADR-015)." }],
  patterns: [
    {
      group: ["kysely", "kysely/*", "@/platform/db", "@/platform/db/*"],
      message:
        "Database access belongs in src/modules/<code>/data/ (PORTS_AND_SERVICES section 2).",
    },
  ],
};
// Every list pages through the shared Turkish ListPagination (DESIGN_SYSTEM_RULES 4.1 row 20).
const paginationImport = {
  name: "@/components/ui/pagination",
  message:
    "Use ListPagination from @/platform/ui/list/list-pagination; COSS pagination parts carry English text.",
};

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
              // Routes are the composition root: they may use a module's public `index.ts` and its
              // `ui/` screens, but not its internal folders (application, domain, infrastructure).
              from: { element: { type: "app" } },
              allow: {
                to: [
                  {
                    element: {
                      types: { anyOf: ["app", "platform", "records", "sandbox", ...cossLayers] },
                    },
                  },
                  { element: { type: "module", fileInternalPath: ["index.ts", "ui/**"] } },
                ],
              },
            },
            {
              // A sandbox only uses its own files; nothing else may depend on a sandbox.
              // A sandbox may use its own files and the COSS UI layer (owner request: shared
              // elements should be the product's, not hand-made). It still may not reach into
              // modules or platform, and nothing may depend on a sandbox.
              from: { element: { type: "sandbox" } },
              allow: {
                to: [
                  {
                    element: {
                      type: "sandbox",
                      captured: { sandboxName: "{{from.element.captured.sandboxName}}" },
                    },
                  },
                  { element: { types: { anyOf: cossLayers } } },
                ],
              },
            },
            {
              from: { element: { type: "module" } },
              allow: { to: { element: { types: { anyOf: ["platform", ...cossLayers] } } } },
            },
            {
              // The composition roots may use platform and each module's public `index.ts` only.
              from: { element: { types: { anyOf: ["jobs", "records"] } } },
              allow: {
                to: [
                  { element: { type: "platform" } },
                  { element: { type: "module", fileInternalPath: ["index.ts"] } },
                ],
              },
            },
            ...modulePolicies,
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
    // Database access (TASK-0101, ADR-015, PORTS_AND_SERVICES section 2): only a module's data
    // layer reaches the database, through `@/platform/db`'s runAsUser. The driver and the query
    // builder stay behind it, so routes, screens and application code cannot open a query.
    files: ["src/**/*.{ts,tsx}"],
    // The outbox worker (platform/jobs) drives transactions on its own pool (TASK-0104).
    ignores: ["src/platform/db/**", "src/modules/*/data/**", "src/platform/jobs/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { ...databaseImports, paths: [...databaseImports.paths, paginationImport] },
      ],
    },
  },
  {
    // The one place allowed to compose COSS pagination.
    files: ["src/platform/ui/list/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", databaseImports] },
  },
  {
    files: ["src/modules/*/data/**/*.{ts,tsx}"],
    // Real-database tests open their own pool as the runtime role (TASK-0101 pattern).
    ignores: ["src/**/*.dbtest.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "pg", message: "Use runAsUser from @/platform/db; the pool is not shared." },
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
