# CLAUDE.md

Project context for Claude Code. This file is loaded automatically.

## Project

SaaS scaffolding template — multi-tenant Next.js app with auth, billing, RBAC, and team management. Used as a starting point for new SaaS projects.

## Architecture Standard: 18-Factor App

This project follows the **18-Factor App** methodology (https://github.com/trentas/18-factor), a modern evolution of the 12-Factor App for the AI era. All architectural decisions, new features, and refactors must align with these factors.

**Applicable factors (Tiers 1-3):**

| Factor | Principle | Status |
|---|---|---|
| 1. Declarative Codebase | All artifacts (code, IaC, prompts, agent tool schemas, AI context files) in version control | Implemented — includes CLAUDE.md as AI assistant context |
| 2. Contract-First Interfaces | Define interfaces before implementation — APIs, events, MCP tools, A2A Agent Cards | Implemented — `openapi.yaml` documents all 23 REST routes |
| 3. Dependency Management | Explicit, pinned, isolated — including AI SDKs and model deps when applicable | Implemented |
| 4. Config, Credentials, Context | 3 categories: config (env vars), credentials (secrets manager), AI context (versioned YAML) | Implemented — `lib/env.ts` Zod validation, fail-fast. Credentials still in env vars (migrate to secrets manager for prod) |
| 5. Immutable Build Pipeline | BUILD → EVAL → RELEASE → DEPLOY → RUN, with eval gates as CI checks | Partial — CI + Docker, needs release artifacts + eval gates |
| 6. Evaluation-Driven Development | Statistical testing for non-deterministic systems | Partial — 84 tests, needs 70% coverage |
| 7. Responsible AI by Design | Safety, fairness, accountability, EU AI Act compliance | N/A until AI features added |
| 8. Identity, Access, Trust | Every actor (human, service, AI agent) has verifiable identity and scoped permissions | Implemented — auth, RBAC, 2FA, rate limit, audit. Agent identity needed when AI features added |
| 9. Disposability/Graceful Lifecycle | Structured startup (liveness → config → readiness), graceful shutdown, health probes | Partial — health endpoint at `/api/health`, needs graceful shutdown + structured startup |
| 10. Intelligent Backing Services | Attached resources swappable via config — includes MCP servers, AI Gateway pattern | Partial — Supabase/Stripe/Resend as resources |
| 11. Environment Parity | Dev ≈ staging ≈ prod, ephemeral per-branch environments for autonomous validation | Partial — Docker + seed, needs staging config |
| 12. Stateless Processes + Caching | Share-nothing processes, semantic caching, provider-level prompt caching | Partial — stateless app, but in-memory rate limiter |
| 13. Adaptive Concurrency | Scale each process type independently, cost-aware auto-scaling | Planned — needs K8s/scaling config |
| 14. Full-Spectrum Observability | Structured logs, traces, metrics, AI SLOs, business observability, cost attribution | Partial — structured JSON logging, needs error tracking + metrics |

**Tier 4 (Intelligence)** — Factors 15-18 apply when AI features are added:
- **15. Model Lifecycle Management** — model registry, version pinning, A/B testing, distillation (teacher→student for 50-80% cost savings), fine-tuning pipeline
- **16. Prompt and Context Engineering** — prompts as versioned artifacts, context window budgets, RAG pipeline, reasoning/thinking token budgets
- **17. Agent Orchestration and Bounded Autonomy** — agent patterns (tool-use, router, pipeline, supervisor), execution budgets, human-in-the-loop gates, Agent SDKs (Anthropic/OpenAI/Google ADK), MCP for tool discovery, A2A protocol, computer use agents
- **18. AI Economics and Cost Architecture** — per-token cost modeling, intelligent model routing, semantic caching ROI, budget circuit breakers, cost attribution

**When making changes, check:** Does this align with the 18-factor principles? Specifically:
- New API routes → update `openapi.yaml` first (Factor 2), add rate limiting (Factor 8), use `logger` not `console` (Factor 14)
- New interfaces → consider MCP tool schemas or A2A Agent Cards if agent-facing (Factor 2)
- New config → add to `lib/env.ts` Zod schema, validate at startup with fail-fast (Factor 4)
- New secrets/credentials → use a secrets manager, not env vars on disk (Factor 4)
- New backing service → treat as attached resource, swappable via config (Factor 10)
- New feature → add tests (Factor 6), add structured logging (Factor 14)
- New process → stateless, disposable, health-checkable (Factors 9, 12)
- Agent-generated changes → must pass CI gates and eval suites without human intervention (Factor 1)
- AI features → define agent identity, bounded autonomy, execution budgets (Factors 8, 17, 18)

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

### Contract-First (Factor 2)
- All API routes are documented in `openapi.yaml` (OpenAPI 3.1)
- **When adding or modifying an API route, update `openapi.yaml` FIRST** — define the contract before writing the implementation
- Include: path, method, request/response schemas, auth requirements, rate limit tier
- The spec is the source of truth for API consumers
- Scope extends beyond REST: event schemas (AsyncAPI/CloudEvents), MCP tool schemas, A2A Agent Cards, and structured output contracts all follow contract-first

### Configuration, Credentials, Context (Factor 4)
Factor 4 defines three categories:
1. **Configuration** (env vars) — model names, feature flags, non-secret settings → validated via Zod in `lib/env.ts`
2. **Credentials** (secrets manager) — API keys, DB passwords, auth secrets → currently in env vars, should migrate to secrets manager for production
3. **AI Context** (versioned files) — model selection, inference params, safety thresholds → will live in versioned YAML when AI features are added

- Import `env` from `@/lib/env` instead of using `process.env` directly
- For `NEXT_PUBLIC_*` in client components, import from `@/lib/constants` (centralizes build-time inlined vars)
- **When adding a new env var:** add it to the schema in `lib/env.ts` (required or optional with default)
- App fails fast on startup if required vars are missing
- **Documented exceptions** (cannot use `env` import):
  - `lib/debug.ts` — circular dependency (it IS the logger that `env.ts` would need)
  - `lib/env.ts` — defines the `env` object itself
  - `lib/features/index.ts` — dynamic `Object.entries(process.env)` scan for `FEATURES__*` keys not in schema
  - `lib/constants.ts` — centralizes `NEXT_PUBLIC_*` for client-side use (Next.js inlines at build time)

### Health Check (Factor 9)
- `GET /api/health` — public, no auth, no rate limiting
- Returns `{ status, uptime, timestamp, checks: { supabase } }`
- Use for Docker HEALTHCHECK, K8s probes, uptime monitoring

### Logging (Factor 14)
- Use `logger` from `lib/debug.ts` — never raw `console.log/error/warn`
- Production: structured JSON to stdout (machine-parseable)
- Development: human-readable with timestamps
- Use `logger.withContext({ requestId, tenant, userId })` for child loggers with correlation
- Use `generateRequestId()` from `lib/debug.ts` for request correlation

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
- Don't add API routes without updating `openapi.yaml` first (contract-first)
- Don't use `process.env` directly — import `env` from `@/lib/env`
- Don't use `console.log/error/warn` in API routes — use `logger` from `@/lib/debug`
