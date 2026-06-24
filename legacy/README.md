# Legacy Archive (Phase 1)

This directory contains the **decommissioned Vite/React SPA** and its associated UI that was replaced by the Next.js App Router shell (`src/app/page.tsx`).

## Contents

| Path | Description |
|------|-------------|
| `spa/` | Vite entry (`App.tsx`, `main.tsx`, `index.html`, `vite.config.ts`) |
| `src/views/` | Legacy page components (Dashboard, Threat Analysis, Synthetic Studio, etc.) |
| `src/components/` | Legacy-only UI (ApiKeyDialog, DataImportDialog, FairnessDriftPanel, LDASearchDialog) |
| `src/hooks/` | `useLiveData` reactive hook used by legacy views |
| `components/shell/` | Unused `GlobalNav` prototype |
| `components/ui/` | Unused shadcn `sidebar`, `sign-in` |
| `tests/` | Playwright E2E suite targeting the legacy SPA (stale vs. current Next.js UI) |

## Active code (not archived)

Domain services remain in **`src/services/`** — they are shared business logic to be wired in Phase 2.

The active application entry point is **`src/app/page.tsx`** with workflow pages under **`src/views/workflows/`**.

## Running the legacy SPA (reference only)

The archived SPA is **not part of the supported build**. To experiment, install Vite locally and run from `legacy/spa/` with path aliases pointing at the repo root `src/` and `legacy/src/` (see `vite.config.ts`).

## E2E tests

```bash
npm test   # runs legacy/playwright.config.ts against legacy UI expectations
```

These tests expect legacy sidebar navigation and data-testids that the Next.js shell no longer provides. Rewrite in Phase 2.
