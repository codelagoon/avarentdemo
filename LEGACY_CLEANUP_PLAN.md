# Legacy Cleanup Plan

## Audit of `legacy/` and Historical Artifacts
The `legacy/` directory does not currently exist. However, the repository has "legacy" Vite artifacts that are dead weight since the move to Next.js App Router.

## Classification

### Archive
- `App.tsx`
- `main.tsx`
- `vite.config.ts`
- `index.html`
*(These are Vite entrypoints that are no longer used by Next.js)*

### Delete
- `src/data/mockData.ts` (Once the services are fully wired to Supabase repositories).

### Keep
- `src/app/`
- `src/components/`
- `src/lib/`
- `src/views/` (Though views should ideally be moved into `app/` routes or converted to standard components).
