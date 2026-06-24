# Deletion Proof Requirement

As per the AVA-17 Execution Authorization, here is the proof for deleting legacy files based on exhaustive `grep` results.

## 1. `src/App.tsx`
- **References Found**: `src/main.tsx` (Line 5)
- **Imports Found**: Imported only by `main.tsx`.
- **Execution Paths**: None. The project is running via Next.js (`next dev`, `src/app/page.tsx`), so `main.tsx` is completely unexecuted dead code.
- **Dependency Analysis**: Self-contained React root component for the old Vite configuration.
- **Deletion Risk**: **None**.
- **Decision**: **Delete**.

## 2. `src/main.tsx`
- **References Found**: `index.html` (Line 17)
- **Imports Found**: Imported only by the unused `index.html` file.
- **Execution Paths**: None in Next.js.
- **Dependency Analysis**: It mounts the Vite app to `#root`.
- **Deletion Risk**: **None**.
- **Decision**: **Delete**.

## 3. `vite.config.ts`
- **References Found**: 0.
- **Imports Found**: None.
- **Execution Paths**: None (`package.json` runs `next`).
- **Dependency Analysis**: Unused bundler configuration.
- **Deletion Risk**: **None**.
- **Decision**: **Delete**.

## 4. `src/data/mockData.ts`
- **References Found**: 14 active imports.
- **Imports Found**: Used in `ledgerService.ts`, `scenarioService.ts`, `threatService.ts`, `AccessControlPage`, `AnalyticsPage`, `DashboardPage`, `EvidenceLedgerPage`, `SettingsPage`, `ThreatAnalysisPage`.
- **Execution Paths**: Highly active. Still powers the charts and mock views in the Dashboard.
- **Dependency Analysis**: Tightly coupled to the UI.
- **Deletion Risk**: **Critical**. Deleting this will break compilation instantly.
- **Decision**: **Archive / Refactor Required**. We must seed the database and refactor these 14 files before deleting it.
