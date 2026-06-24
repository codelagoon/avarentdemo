# Legacy Validation Report

As per Directive 7, here is the validation for every file proposed for deletion.

## 1. `src/App.tsx` & `src/main.tsx` & `index.html` & `vite.config.ts`
- **References Found**: `main.tsx` imports `App.tsx`. `index.html` imports `main.tsx`.
- **Execution Path**: None in production. `package.json` uses `next dev` and `next build` to serve `src/app/page.tsx`. These files are remnants of the initial Vite prototype.
- **Deletion Risk**: **Low**. They are dead code in the Next.js context.
- **Recommendation**: **Delete**.

## 2. `src/data/mockData.ts`
- **References Found**: Imported in 14 locations, including `ledgerService.ts`, `threatService.ts`, `AnalyticsPage.tsx`, `DashboardPage.tsx`, `EvidenceLedgerPage.tsx`.
- **Execution Path**: Highly active. It powers the entire visual dashboard, chart data, and the simulated scenario runner.
- **Deletion Risk**: **Critical**. Deleting this file without completely refactoring the UI dashboards and chart components to read from actual Supabase Repositories will break compilation and crash the app.
- **Recommendation**: **Archive / Do Not Delete Yet**. We must first migrate every single chart and table to query real aggregate repositories (or seed the DB) before we can safely delete `mockData.ts`.
