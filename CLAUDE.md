# CLAUDE.md

Project context for Claude Code. This file is loaded automatically.

## Project

SaaS scaffolding template — multi-tenant Next.js app with auth, billing, RBAC, and team management. Used as a starting point for new SaaS projects.

## Architecture Standard: 18-Factor App

This project follows the **18-Factor App** methodology (https://github.com/trentas/18-factor), a modern evolution of the 12-Factor App for the AI era. All architectural decisions, new features, and refactors must align with these factors.

**Applicable factors (Tiers 1-3):**

| Factor | Principle | Status |
|---|---|---|
| 1. Declarative Codebase | Everything in version control, reproducible | Implemented |
| 2. Contract-First Interfaces | Define interfaces before implementation | Planned — needs OpenAPI spec |
| 3. Dependency Management | Explicit, pinned, isolated deps | Implemented |
| 4. Config, Credentials, Context | Env vars + secrets manager + structured config | Planned — needs env validation, secrets separation |
| 5. Immutable Build Pipeline | Build once, deploy everywhere | Partial — CI + Docker, needs release artifacts |
| 6. Evaluation-Driven Development | Statistical testing for non-deterministic systems | Partial — 84 tests, needs 70% coverage |
| 7. Responsible AI by Design | Safety, fairness, accountability | N/A until AI features added |
| 8. Identity, Access, Trust | Every actor has verifiable identity and scoped permissions | Implemented — auth, RBAC, 2FA, rate limit, audit |
| 9. Disposability/Graceful Lifecycle | Fast start, graceful shutdown, health probes | Planned — needs health endpoint, graceful shutdown |
| 10. Intelligent Backing Services | Attached resources, swappable via config | Partial — Supabase/Stripe/Resend as resources |
| 11. Environment Parity | Dev ≈ staging ≈ production | Partial — Docker + seed, needs staging config |
| 12. Stateless Processes + Caching | Share-nothing processes, intelligent caching | Partial — stateless app, but in-memory rate limiter |
| 13. Adaptive Concurrency | Scale each process type independently | Planned — needs K8s/scaling config |
| 14. Full-Spectrum Observability | Structured logs, traces, metrics | Planned — needs structured logging, error tracking |

**Tier 4 (Intelligence)** — Factors 15-18 apply when AI features are added (model lifecycle, prompt engineering, agent orchestration, AI economics).

**When making changes, check:** Does this align with the 18-factor principles? Specifically:
- New API routes → define contract first (Factor 2), add rate limiting (Factor 8)
- New config → validate at startup with fail-fast (Factor 4)
- New backing service → treat as attached resource, swappable via config (Factor 10)
- New feature → add tests (Factor 6), add structured logging (Factor 14)
- New process → stateless, disposable, health-checkable (Factors 9, 12)

## Stack

- **Next.js 16** (App Router, Turbopack, standalone output)
- **React 19**, **TypeScript 5.9**
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives)
- **Supabase** (Postgres + RLS + Storage) — no ORM, direct client
- **NextAuth v4** (JWT strategy, credential + Google OAuth)
- **Stripe** v21 (subscriptions, billing portal, webhooks)
- **Vitest 4** for testing

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint with auto-fix
npm test             # Run tests (vitest)
npm run format       # Prettier
npm run db:seed      # Seed demo data (demo@example.com / password123)
npm run db:migrate   # Push migrations to Supabase
npm run db:reset     # Reset database
```

## Architecture

```
src/app/              # Next.js App Router pages and API routes
  [tenant]/           # Multi-tenant routes (dashboard, profile, team, etc.)
  api/                # API route handlers
  auth/               # Auth pages (signin, signup, reset, verify, 2FA)
src/components/       # React components (ui/, tenant/, profile/, team/, blocks/)
src/actions/          # Server actions (organization, team, profile)
src/hooks/            # Custom React hooks
lib/                  # Core utilities (auth, supabase, stripe, rate-limit, etc.)
features/             # Modular feature modules (billing, analytics, webhooks)
config/               # Feature flag configuration
supabase/migrations/  # SQL migrations (run in order, 001-007)
scripts/              # Dev scripts (seed, debug, clean)
tests/                # Vitest test files
```

## Key Conventions

### Routing
- Multi-tenant via `proxy.ts` (replaces middleware.ts in Next.js 16)
- Tenant context from subdomain or path: `[tenant]/dashboard`
- All API routes under `src/app/api/` using App Router `route.ts`

### Async APIs (Next.js 16)
- `params` and `searchParams` must be **awaited** in pages/layouts/routes
- `cookies()`, `headers()` from `next/headers` must be **awaited**
- Client components use `useSearchParams()` hook (no change needed)

### Rate Limiting
Every API route must have rate limiting as the **first line** in the handler:
```typescript
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = authRateLimit(request);
  if (limited) return limited;
  // ...
}
```
Tiers:
- `authRateLimit` — 10 req/min (login, signup, 2FA)
- `strictAuthRateLimit` — 5 req/15min (password reset, email verify, resend)
- `apiRateLimit` — 60 req/min (authenticated routes)
- `uploadRateLimit` — 10 req/min (file uploads)

Exception: Stripe webhook route (protected by signature verification).

### Imports
Grouped and ordered by ESLint config:
1. Built-in / React / Next.js
2. External packages
3. Internal `@/lib/*`, `@/components/*`, `@/actions/*`

Separated by blank lines between groups, alphabetized within groups.

### Stripe (v21)
- Client is lazy-initialized (avoids build-time errors without env vars)
- `current_period_end` lives on `subscription.items.data[0]`, not on subscription
- Invoice subscription ID: `invoice.parent?.subscription_details?.subscription`
- API version: `2026-03-25.dahlia`

### Auth
- NextAuth v4 with JWT strategy and database-backed user lookups
- `getServerSession(authOptions)` for server-side auth checks
- Roles: `owner`, `admin`, `member` — checked via `lib/permissions.ts`
- 2FA with TOTP (speakeasy)
- Account locking after failed attempts

### Database
- Supabase with Row Level Security (RLS) on all tables
- `supabaseAdmin` (service role) for backend operations
- Migrations in `supabase/migrations/` — sequential, numbered
- No ORM — use Supabase client directly with typed queries

### Components
- Use shadcn/ui components from `src/components/ui/`
- Brand icons from `react-icons/fa6` (not lucide — lucide v1 removed brand icons)
- Feature icons from `lucide-react`
- Theme: `next-themes` with `ThemeInitializer` component

### Feature Flags
- Configured in `config/features.config.ts`
- Server: `isFeatureEnabled('featureName')`
- Client: `useFeatureFlags()` hook via `FeatureFlagsProvider`

## Testing

- **Framework:** Vitest 4
- **Minimum coverage:** 70% (lines, branches, functions, statements)
- **Test location:** `tests/` directory, mirroring source structure
- **Naming:** `<feature>.test.ts`
- **Run:** `npm test` or `npx vitest run --coverage`
- Tests must pass in CI before merge (GitHub Actions)
- Mock external services (Supabase, Stripe) — don't hit real APIs in tests
- Rate limiter uses optional chaining on `request.headers` to support mock requests

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push/PR to main:
1. **Lint** — `eslint .` (errors fail, warnings allowed)
2. **Type Check** — `tsc --noEmit`
3. **Test** — `vitest run`
4. **Build** — `next build` (runs after lint + typecheck + test pass)
5. **Security Audit** — `npm audit --audit-level=high`

## Docker

```bash
# Production
docker compose up app

# Development (hot reload)
docker compose --profile dev up dev
```

Dockerfile uses multi-stage build with `output: "standalone"` in next.config.ts.

## Don't

- Don't use `NextRequest.ip` (removed in Next.js 16)
- Don't use sync `cookies()`/`headers()` (must await)
- Don't use `middleware.ts` (use `proxy.ts`)
- Don't use `@supabase/auth-helpers-nextjs` (deprecated, use `@supabase/ssr`)
- Don't use `next lint` (removed in Next.js 16, use `eslint` directly)
- Don't import brand icons from `lucide-react` (use `react-icons/fa6`)
- Don't skip rate limiting on new API routes
- Don't initialize Stripe eagerly at module level (use lazy init pattern)
