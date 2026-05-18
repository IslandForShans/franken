# Refactor Plan

## Baseline

- Project type: React 18 + Vite app.
- Repository guidance: no `AGENTS.md` found in this repo tree.
- Verification declared in `package.json`: `npm run build`.
- No lint or test scripts are currently declared.
- Local environment anomaly: `node` and `npm` are not available on PATH in this shell, so build verification is expected but currently blocked locally.

## Phase 1: Shared Swap Component Lookup

Status: implemented. Native `esbuild` bundle check passed; official `npm run build` is blocked locally because `node` and `npm` are not on PATH.

Milestone: remove duplicated component lookup logic from draft and theorycrafting flows.

Files:

- `src/utils/swapUtils.js`
- `src/components/TheorycraftingApp.jsx`
- `src/components/DraftSimulator.jsx`

Intent:

- Keep `findFullComponentData` as the single source of truth for faction and tile lookup.
- Preserve the existing fallback behavior for extra and forced components.
- Avoid changing draft behavior or component shapes.

Verification:

- Intended: `npm run build`
- Local fallback while Node is unavailable: native `esbuild` bundle check plus source inspection.

## Phase 2: Undraftable Component Metadata Cleanup

Status: implemented. Native `esbuild` bundle check passed; official `npm run build` is blocked locally because `npm` is not on PATH in this shell.

Milestone: remove unused imports and normalize small metadata helpers without changing component definitions.

Files:

- `src/data/undraftable-components.js`

Intent:

- Remove unused dependencies.
- Keep the component table data intact unless a typo is proven to be unreachable dead data.

Verification:

- Intended: `npm run build`

## Phase 3: Large Component Decomposition Candidates

Status: implementation complete. Auto-component category, object creation, triggered predicate, and identity helpers extracted across draft, theorycrafting, and faction roller flows. Native `esbuild` bundle check passed; official `npm run build` is blocked locally because `npm` is not on PATH in this shell.

Milestone: prepare safe extractions from the largest components after Phase 1 passes.

Candidate files:

- `src/components/DraftSimulator.jsx`
- `src/components/TI4MapBuilder.jsx`
- `src/components/CombatSimulator.jsx`
- `src/components/TheorycraftingApp.jsx`
- `src/utils/componentCategories.js`
- `src/utils/componentIdentity.js`

Intent:

- Extract pure helpers before UI decomposition.
- Prefer small utility functions over new abstractions.
- Keep each extraction independently buildable.

Verification:

- Intended: `npm run build` after each extracted module.
