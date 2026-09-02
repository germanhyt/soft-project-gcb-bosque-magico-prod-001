# Bosque Mágico — Code Review Rules (GGA)

Monorepo: `apps/api` (NestJS + Prisma), `apps/panel` y `apps/landing` (React + Vite).

## General

REJECT if:
- Hardcoded secrets, API keys, JWT secrets or real credentials (`.env` must never be committed)
- `any` without justification in TypeScript
- Empty `catch` blocks (silent failures)
- `console.log` left in production paths (panel/API); scripts en `scripts/` are exempt
- Duplicated business logic that belongs in a shared service or use-case
- Breaking changes to Prisma schema without a migration in `apps/api/prisma/migrations/`

PREFER:
- Spanish for user-facing copy; English for code identifiers
- Minimal diffs; reuse existing components and use-cases

## API (`apps/api`)

Architecture (obligatorio):
- **presentation/** → controllers (HTTP only, thin)
- **application/use-cases/** → orchestration and business flow
- **application/dto/** → validation (`class-validator`)
- **domain/services/** → domain logic reusable across use-cases
- **infrastructure/repositories/** → Prisma/data access
- Controllers must not call Prisma directly

REJECT if:
- Business rules in controllers or repositories instead of use-cases/domain
- Missing DTO validation on write endpoints
- Public endpoints without `@Public()` or without auth guard where required
- Mutations without audit trail when the module already logs auditoría (solicitudes, cotizaciones, eventos)

PREFER:
- NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Prisma field `etapa` in DB/API; do not rename to `estado` without explicit migration

## Panel (`apps/panel`)

UX (obligatorio):
- **Nuevo registro y edición** → `Modal` (`components/ui/Modal.tsx`), not dedicated `*Page.tsx` forms
- **Detalle + acciones** → `DetalleModal` with list context (`?detalle=id` optional)
- SweetAlert2 **only** for confirm/cancel/toast — **not** for long forms

REJECT if:
- New CRUD form as a full page route instead of Modal
- UI labels say **"Etapa"** — use **"Estado"** (DB field remains `etapa`)
- New list/table without pagination pattern (`DataTableCard`, `DataTablePagination`) when listing entities
- Bypassing permission checks on panel actions

PREFER:
- `PageHeader` with breadcrumbs (`CRUMB_INICIO`)
- `TableFiltersPanel` for list filters
- Solicitudes = operational leads module; Clientes = identity/history view

## Landing (`apps/landing`)

REJECT if:
- Panel-only auth logic leaked into public landing
- Broken SEO metadata on key pages without reason

## Response Format (GGA)

FIRST LINE must be exactly:
```
STATUS: PASSED
```
or
```
STATUS: FAILED
```

If FAILED, list each issue as: `file:line - rule violated - issue`
