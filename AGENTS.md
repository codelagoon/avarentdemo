# AGENTS.md

## Cursor Cloud specific instructions

AVARENT Meridian is a single **Next.js 16 (App Router) + React 19** frontend — a fair-lending
compliance command center. There is no separate backend service to run for development: the UI
runs entirely on bundled mock data (`src/data/mockData.ts`) and `localStorage`. Supabase, Inngest,
and the Modal Python files (`modal_*.py`) are optional integrations and are **not required** to run
or test the app.

### Running / building / testing
Scripts live in `package.json`; use those rather than duplicating commands here:
- Dev server: `npm run dev` → serves on `http://localhost:5173` (Next dev, Turbopack).
- Type check (there is no separate lint script — this is the lint-equivalent): `npm run typecheck`.
- Production build: `npm run build`.
- E2E tests: `npm run test` (Playwright). See caveat below before running.

### Non-obvious caveats
- **Vite leftovers are dead code.** `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`,
  and `dist/` are stale Vite-era artifacts. The live entrypoint is the App Router under `src/app/`
  (`src/app/page.tsx`). Don't run `vite` — the real dev/build commands are Next.js.
- **`next.config.js` sets `typescript.ignoreBuildErrors: true`**, so `next build` will NOT fail on
  type errors. Run `npm run typecheck` to actually surface TS errors.
- **Login / demo access:** there is no real auth needed. On the login screen enter demo code
  `197704` (or type `avarent` anywhere on the page) to open the onboarding wizard; completing it
  (or the demo bypass) lands you on the dashboard. Real Supabase email/password auth only works if
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
- **Playwright config is not CI-portable as-is:** `playwright.config.ts` hardcodes a macOS
  `executablePath` for Chrome and `headless: false`. On a headless Linux VM you must override these
  (e.g. remove `executablePath`, run headless) — otherwise `npm run test` will fail to launch a
  browser. The app itself runs fine regardless.
- API keys for the AI credit-analysis edge function (OpenRouter/NVIDIA) are optional; without them
  `scenarioService` falls back to deterministic local logic — no functional impact on the demo.
- **GUI testing gotcha:** running a Red Team / "Execute Adversarial Test" scenario briefly shows a
  full-screen splash (white animating cube on a black background) and this loading splash also
  flashes intermittently afterward. This is expected animation/transition behavior, **not** a crash
  — the dashboard re-renders with results (Insights panel AIR/SPD, "severed" count, Evidence Ledger
  entries) each time. When capturing screenshots/video, wait for the splash to resolve before
  asserting the result state.
