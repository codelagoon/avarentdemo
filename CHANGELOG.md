# Changelog

All notable changes to this project are documented in this file.

## [0.1.0.0] - 2026-06-23

### Added
- WorkOS AuthKit sign-in, sign-out, and organization onboarding with tenant-scoped identity context
- API routes for identity context and onboarding (`/api/auth/*`, `/api/identity/*`)
- Meridian single-page AppShell with nine workflow views (command center, investigations, monitoring, and more)
- Domain layer with `useLiveData` wiring for investigations, monitoring, documentation, and audit workflows
- Supabase migrations for identity foundation and RLS hardening
- gstack project setup (`npm run setup:gstack`) and `CLAUDE.md` agent instructions

### Changed
- Replaced legacy Vite multi-page app with Next.js App Router single-route dashboard
- Onboarding flow rewritten for dark theme and WorkOS-backed org creation
- Moved Playwright config to `legacy/` for optional legacy test runs

### Removed
- Legacy Vite entrypoints (`App.tsx`, `main.tsx`, `index.html`) and obsolete page components
