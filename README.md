# SaaS Multi-Tenant Scaffolding

A production-ready multi-tenant SaaS scaffolding built with Next.js 16, Supabase, Stripe, and shadcn/ui. Follows the [18-Factor App](https://github.com/trentas/18-factor) methodology.

## Features

### Core Features
- **Multi-tenant Architecture** — Subdomain-based tenant routing (`company.app.com`)
- **Secure Authentication** — NextAuth.js with email verification, password reset, and 2FA (TOTP)
- **User Management** — Role-based access control (owner/admin/member)
- **Team Management** — Email invitations, role management, member control, and ownership transfer
- **User Profile & Settings** — Profile management, password change, 2FA, theme preferences
- **Organization Management** — Logo upload, settings, rename, and deletion (owner only)
- **Database** — Supabase with Row Level Security (RLS) on all tables
- **Billing** — Stripe v21 integration for subscriptions and payments
- **Email System** — Resend integration for verification, notifications, and alerts
- **Rate Limiting** — Per-route rate limiting with 4 tiers (auth, strict, API, upload)
- **Security** — Account locking, strong passwords, session management, audit logging
- **Theme System** — Light/Dark/System mode with cross-browser persistence
- **UI Components** — shadcn/ui with Tailwind CSS 4
- **Feature Flags** — Modular feature system for easy customization
- **Health Check** — `/api/health` endpoint with backing service checks
- **Structured Logging** — JSON logs in production, human-readable in development
- **API Documentation** — OpenAPI 3.1 spec (`openapi.yaml`)

### Modular Features (Configurable)
- **Audit Log** — Organization activity auditing and history
- **Analytics** — Usage tracking and analytics dashboard
- **Notifications** — Email notification system
- **API Keys** — API key management for integrations
- **Webhooks** — Webhook system for integrations

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, standalone output)
- **Frontend**: React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Database**: Supabase (PostgreSQL + RLS + Storage)
- **Payments**: Stripe v21
- **Authentication**: NextAuth.js v4 (JWT strategy, credential + Google OAuth)
- **Email**: Resend for transactional emails
- **Testing**: Vitest 4 with 70% coverage threshold
- **CI/CD**: GitHub Actions (lint, typecheck, test, build, security audit)
- **Container**: Docker with multi-stage build

## Getting Started

### Prerequisites

- Node.js 20.9+
- npm
- Supabase account
- Stripe account (optional — for billing features)
- Resend account (for email functionality)
- Google Cloud Console project (optional — for Google OAuth)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd saas-scaffolding
npm install
```

### 2. Environment Setup

Create `.env.local` with the required variables. The app validates all env vars at startup and fails fast if any required vars are missing.

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Email (Required)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@example.com

# JWT for Microservices (Optional — falls back to NEXTAUTH_SECRET)
JWT_SECRET=your-jwt-secret-key-min-32-characters-long
JWT_ISSUER=saas-scaffolding
JWT_AUDIENCE=microservices

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (Optional — billing disabled without these)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# App (Optional — has defaults)
NEXT_PUBLIC_APP_NAME="My SaaS"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Debug (Optional)
DEBUG_LEVEL=DEBUG
```

### 3. Database Setup

1. Create a Supabase project
2. Run the migrations in order:
   ```bash
   # If using Supabase CLI:
   npm run db:migrate

   # Or run each file manually in Supabase SQL editor:
   # supabase/migrations/001_initial_schema.sql
   # supabase/migrations/002_auth_enhancements.sql
   # supabase/migrations/003_user_preferences.sql
   # supabase/migrations/004_add_logo_url.sql
   # supabase/migrations/005_refresh_tokens.sql
   # supabase/migrations/006_auto_accept_domain_setting.sql
   # supabase/migrations/007_audit_logs.sql
   # supabase/policies/rls_policies.sql
   ```
3. Create storage buckets: `organization-logos` and `user-avatars` (public)
4. Run storage policies: `supabase/storage/storage_policies.sql`

### 4. Seed Demo Data

```bash
npm run db:seed
```

Creates a demo user (`demo@example.com` / `password123`) with an organization at `/demo/dashboard`.

### 5. Run

```bash
npm run dev          # Development (Turbopack)
npm run build        # Production build
npm run start        # Production server
```

### 6. Run Tests

```bash
npm test                        # Run all tests
npx vitest run --coverage       # Run with coverage report
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint with auto-fix |
| `npm test` | Run tests (Vitest) |
| `npm run format` | Prettier formatting |
| `npm run db:seed` | Seed demo data |
| `npm run db:migrate` | Push migrations to Supabase |
| `npm run db:reset` | Reset database |

## Project Structure

```
├── proxy.ts                    # Tenant routing (replaces middleware.ts in Next.js 16)
├── openapi.yaml                # OpenAPI 3.1 spec for all API routes
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # Production + dev profiles
├── next.config.ts              # Next.js config (standalone output, MDX)
├── vitest.config.ts            # Test config with 70% coverage threshold
├── .github/workflows/ci.yml    # CI pipeline
│
├── src/app/
│   ├── api/                    # API route handlers (23 routes)
│   │   ├── health/             # Health check endpoint
│   │   ├── auth/               # Authentication (signup, verify, 2FA, password reset)
│   │   ├── organizations/      # Organization CRUD, settings, logo
│   │   ├── tenants/            # Tenant-scoped routes (audit logs)
│   │   ├── microservices/      # JWT token management
│   │   ├── users/              # User avatar upload
│   │   └── webhooks/           # Stripe webhooks
│   ├── auth/                   # Auth pages (signin, signup, reset, verify, 2FA)
│   ├── [tenant]/               # Tenant routes (dashboard, profile, team, billing, etc.)
│   └── setup/                  # Organization onboarding
│
├── src/components/             # React components
│   ├── ui/                     # shadcn/ui components
│   ├── tenant/                 # Navbar, Sidebar, OrganizationSwitcher
│   ├── organization/           # LogoUpload, DeleteOrganizationDialog
│   ├── profile/                # ChangePasswordDialog, Enable2FADialog
│   ├── team/                   # TeamMemberCard, TransferOwnershipDialog
│   └── blocks/                 # Landing page blocks
│
├── src/actions/                # Server actions (organization, team, profile)
├── src/hooks/                  # Custom React hooks
│
├── lib/                        # Core utilities
│   ├── env.ts                  # Env validation (Zod schema, fail-fast)
│   ├── auth.ts                 # NextAuth configuration
│   ├── supabase.ts             # Supabase clients
│   ├── stripe.ts               # Stripe integration (lazy init)
│   ├── rate-limit.ts           # Rate limiting (4 tiers)
│   ├── debug.ts                # Structured logging (JSON prod, readable dev)
│   ├── permissions.ts          # RBAC role-based access
│   ├── two-factor.ts           # 2FA (TOTP + backup codes)
│   ├── microservice-auth.ts    # JWT token management
│   ├── audit-logger.ts         # Audit event logging
│   ├── email.ts                # Email templates and sending
│   ├── tenant.ts               # Tenant context resolution
│   ├── storage.ts              # Supabase Storage utilities
│   └── form-schema.ts          # Zod validation schemas
│
├── features/                   # Modular feature modules
├── config/                     # Feature flag configuration
├── supabase/                   # Migrations, RLS policies, storage policies
├── scripts/                    # Dev scripts (seed, debug, clean)
└── tests/                      # Vitest test files
```

## Docker

```bash
# Production
docker compose up app

# Development (hot reload)
docker compose --profile dev up dev
```

## CI/CD

GitHub Actions pipeline runs on push/PR to main:

1. **Lint** — ESLint (errors fail, warnings allowed)
2. **Type Check** — `tsc --noEmit`
3. **Test** — Vitest with coverage
4. **Build** — `next build` (runs after lint + typecheck + test)
5. **Security Audit** — `npm audit --audit-level=high`

## API Documentation

All 23 API routes are documented in `openapi.yaml` (OpenAPI 3.1). Routes are organized by tag:

| Tag | Routes | Description |
|---|---|---|
| health | 1 | Service health with Supabase check |
| auth | 13 | Authentication, signup, 2FA, password reset |
| organizations | 5 | Organization CRUD, settings, logo |
| tenants | 1 | Tenant-scoped audit logs |
| microservices | 3 | JWT token generation, refresh, revoke |
| users | 2 | Avatar upload and delete |
| webhooks | 1 | Stripe webhook receiver |

## Rate Limiting

Every API route has rate limiting applied as the first operation:

| Tier | Limit | Routes |
|---|---|---|
| `authRateLimit` | 10 req/min | Login, signup, 2FA |
| `strictAuthRateLimit` | 5 req/15min | Password reset, email verify, resend |
| `apiRateLimit` | 60 req/min | Authenticated API routes |
| `uploadRateLimit` | 10 req/min | File uploads (avatar, logo) |

Exceptions: Stripe webhook (signature verification), health check (public).

## Authentication Flow

1. **Sign Up** — User creates account, email verification required
2. **Organization Setup** — User creates organization, becomes owner
3. **Sign In** — Redirected to organization dashboard (or setup if no orgs)
4. **Multi-tenant** — Users can belong to multiple organizations with different roles
5. **2FA** — Optional TOTP-based two-factor authentication

## Role-Based Access Control

| Permission | Owner | Admin | Member |
|---|---|---|---|
| View organization | Yes | Yes | Yes |
| Update organization | Yes | Yes | No |
| Delete organization | Yes | No | No |
| Manage billing | Yes | No | No |
| Invite members | Yes | Yes | No |
| Remove members | Yes | Members only | No |
| Change roles | Yes | No | No |
| Transfer ownership | Yes | No | No |

## Stripe Setup (Optional)

1. Get API keys from Stripe dashboard
2. Create products/prices for your plans
3. Set up webhook at `/api/webhooks/stripe` with events:
   - `customer.subscription.created/updated/deleted`
   - `invoice.payment_succeeded/failed`

## Architecture Standard

This project follows the [18-Factor App](https://github.com/trentas/18-factor) methodology. See `CLAUDE.md` for the full compliance table and conventions.

## License

MIT License
