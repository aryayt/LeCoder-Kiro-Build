# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the Next.js 15 app router code, AI agents, Prisma-backed services, and shared utilities (use the `~/` alias for imports).
- `__tests__/` mirrors the runtime modules with Jest suites; `e2e/` and `playwright.config.ts` contain Playwright flows.
- `prisma/` stores the data model (`schema.prisma`) and seeds; `public/` hosts static assets; `docs/` and `kiro-exp1-specs/` provide product, design, and tech references.

## Build, Test, and Development Commands
- `npm run dev` — start the local Next.js server (requires configured `.env`).
- `npm run build` / `npm run build:production` — run the Turbo pipeline; production variant also enforces lint and type checks.
- `npm run check` / `npm run check:write` — execute Biome linting (use the `:write` variant to apply safe fixes).
- `npm run typecheck` — strict `tsc --noEmit` validation across the monorepo.
- `npm test`, `npm run test:e2e`, and `npm run test:coverage` — run Jest unit tests, Playwright E2E suites, and coverage reports respectively.

## Coding Style & Naming Conventions
- TypeScript everywhere; keep components in PascalCase, hooks/utilities in camelCase, and files/folders in kebab-case per specs.
- Biome replaces ESLint/Prettier. Ensure files pass `npm run check` before submission and prefer auto-fixes via `npm run check:write`.
- Follow Tailwind CSS v4 utility-first styling; co-locate component styles rather than global overrides.

## Testing Guidelines
- Unit tests live beside domain folders under `__tests__` with `.test.ts(x)` suffixes mirroring import paths.
- Use Jest + Testing Library for UI logic and mock AI providers through shared fixtures in `__tests__/ai/test-utils.ts`.
- End-to-end scenarios use Playwright (`npm run test:e2e`). Target high-risk user journeys: PDF upload, pipeline progress, download flows.

## Commit & Pull Request Guidelines
- Format commit subjects imperatively (e.g., `fix ai cache token shape`) and scope them narrowly; reference issue IDs when available.
- PRs should summarise user-facing impact, include test evidence (`npm run check` + `npm run typecheck` + relevant tests), and attach screenshots for UI updates.
- Keep branches rebased atop `main`; avoid force-pushing after review unless coordinated.

## Security & Configuration Tips
- Duplicate `.env.example` to `.env` and populate Supabase, Better Auth, and AI provider keys before running commands or tests.
- Protect secrets: never commit `.env` artifacts. Use `start-database.sh` for local PostgreSQL and rotate API keys through the Supabase UI or `scripts/database-monitoring.ts` helpers.
