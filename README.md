# Finance App V1 (Next.js + Prisma + Tailwind)

PR #1→#7 appliquées. UI connectée aux actions serveur. DB SQLite pour le local.

## Installation
```bash
pnpm i
cp .env.example .env
pnpm prisma:migrate
pnpm dev
```
App: http://localhost:3000

## Scripts
- `pnpm dev` / `pnpm build && pnpm start`
- `pnpm prisma:migrate` / `pnpm prisma:studio`
- `pnpm test` (unit) / `pnpm test:e2e` (Playwright)

## Notes
- `E2E_ROLE` force le rôle (RBAC) si vous n’utilisez pas Clerk.
- Pour Postgres, changez `DATABASE_URL` et refaites les migrations.
