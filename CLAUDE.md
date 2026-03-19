# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Dimdim — Assistente Financeiro Pessoal (Personal Finance Dashboard). Next.js 14 App Router with SQLite (better-sqlite3) and JWT auth.

## Commands

```bash
npm run dev          # Dev server on port 3500
npm run build        # Production build
npm run start        # Production server (uses $PORT or 3000)
npm run lint         # ESLint
```

## Architecture

- **Framework:** Next.js 14.2.35, React 18, TypeScript, Tailwind CSS
- **Database:** SQLite via better-sqlite3 with WAL mode. Schema defined in `src/lib/db.ts`. DB file: `dimdim.db` (gitignored)
- **Auth:** JWT in httpOnly cookie `dimdim_session`. Secret in env or hardcoded fallback. 7-day TTL. Functions in `src/lib/auth.ts`
- **Seed:** `src/lib/seed.ts` — called lazily on API hits, inserts demo data if user "ronald" doesn't exist

### Route Groups

- `src/app/(dashboard)/` — Protected pages (checks `/api/auth/me` client-side, redirects to `/login`)
- `src/app/api/` — REST API routes (all call `seed()` + `getSession()`)
- `src/app/login/` — Public login page

### Key API Patterns

Every API route follows: `seed() → getSession() → if !session return 401 → db query → return JSON`. CRUD endpoints use dynamic `[id]` segments with GET/PUT/DELETE handlers.

### Data Model

Core tables: `users`, `transacoes`, `cartoes`, `cartoes_catalogo`, `metas`, `categorias`, `programas_pontos`, `analise_pontos`, `assinaturas`, `contas_familia`, `buscas_preco`, `aulas`, `progresso_aulas`, `alertas`

### UI

Dashboard layout with Sidebar component. Charts via chart.js/react-chartjs-2. Confetti via canvas-confetti. Path alias: `@/*` → `./src/*`

## Important Notes

- `/api/aulas` returns aulas grouped by trilha (object with keys `iniciante`, `moderado`, `avancado`), not a flat array
- `/api/auth/me` returns `{ user: { ... } }` (nested under `user` key)
- Card deletion is soft-delete (`ativo = 0`), not hard delete
- When changing API routes, always `rm -rf .next` before rebuild to avoid stale cache issues
- Deploy target: Railway (needs `PORT` env var)
