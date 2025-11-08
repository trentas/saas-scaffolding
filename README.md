# SaaS Multi-Tenant Scaffolding

A production-ready multi-tenant SaaS scaffolding built with Next.js 15, Supabase, Stripe, and shadcn/ui. This template provides a solid foundation for building scalable multi-tenant SaaS applications.

## Features

### Core Features
- ✅ **Multi-tenant Architecture** - Subdomain-based tenant routing (`company.app.com`)
- ✅ **Secure Authentication** - NextAuth.js with email verification, password reset, and 2FA
- ✅ **User Management** - Role-based access control (owner/admin/member)
- ✅ **Team Management** - Email invitations, role management, member control, and ownership transfer
- ✅ **User Profile & Settings** - Complete profile management, password change, 2FA, theme preferences (persists across sessions)
- ✅ **Organization Management** - Logo upload, settings, and organization deletion (owner only)
- ✅ **Database** - Supabase with Row Level Security (RLS) policies
- ✅ **Billing** - Stripe integration for subscriptions and payments
- ✅ **Email System** - Resend.com integration for verification, notifications, and ownership transfer alerts
- ✅ **Security Features** - Account locking, strong passwords, session management
- ✅ **Theme System** - Light/Dark/System mode with cross-browser persistence
- ✅ **UI Components** - shadcn/ui with Tailwind CSS 4
- ✅ **Feature Flags** - Modular feature system for easy customization

### Modular Features (Configurable)
- 🔧 **Analytics** - Usage tracking and analytics dashboard
- 🔧 **Notifications** - Email and push notification system
- 🔧 **API Keys** - API key management for integrations
- 🔧 **Webhooks** - Webhook system for integrations

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe
- **Authentication**: NextAuth.js with database sessions
- **Email**: Resend.com for transactional emails
- **Security**: bcrypt for password hashing, account locking, 2FA
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for billing features)
- Resend.com account (for email functionality)
- Google Cloud Console project (optional, for Google OAuth)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd saas-scaffolding
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth Configuration (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_DEBUG=true

# JWT Configuration for Microservices (Required)
JWT_SECRET=your-jwt-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-optional-uses-jwt-secret-if-not-set
JWT_ISSUER=saas-scaffolding
JWT_AUDIENCE=microservices

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Stripe Configuration (Required for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# App Configuration (Optional)
NEXT_PUBLIC_APP_NAME="My SaaS"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOGO_URL=/logo.svg

# Resend Configuration (Required for emails)
RESEND_API_KEY=re_...

# Email Configuration
EMAIL_FROM=noreply@example.com

# Debug Configuration
DEBUG_LEVEL=DEBUG
DEBUG_AUTH=true
DEBUG_EMAIL=true
DEBUG_DATABASE=true
DEBUG_API=true
```

### 3. Database Setup

#### Supabase Setup

1. Create a new Supabase project
2. Run the migration files in order:
   ```sql
   -- Run these in your Supabase SQL editor in this exact order:
   
   -- 1. Initial schema
   -- File: supabase/migrations/001_initial_schema.sql
   
   -- 2. Authentication enhancements
   -- File: supabase/migrations/002_auth_enhancements.sql
   
   -- 3. User preferences and MFA settings
   -- File: supabase/migrations/003_user_preferences.sql
   
   -- 4. Organization logo support
   -- File: supabase/migrations/004_add_logo_url.sql
   
   -- 5. Refresh token support
   -- File: supabase/migrations/005_refresh_tokens.sql

   -- 6. Automatic domain allow-list configuration
   -- File: supabase/migrations/006_auto_accept_domain_setting.sql

   -- 7. Row Level Security policies (must run after all migrations)
   -- File: supabase/policies/rls_policies.sql
   ```

3. Verify that Row Level Security is enabled on all tables (this is automatically done by step 7 above, but you can verify in Supabase dashboard)
4. Set up authentication providers in Supabase dashboard

#### Database Schema

The scaffolding includes these main tables:
- `organizations` - Tenant data with slug, plan, settings, and logo_url
- `users` - User profiles with preferences and theme settings
- `organization_members` - User-organization relationships with roles (owner/admin/member)
- `invitations` - Email invitations with tokens
- `subscriptions` - Stripe subscription data

#### Supabase Storage Setup

1. Create two public storage buckets in Supabase Dashboard:
   - `organization-logos`
   - `user-avatars`
2. For each bucket, enable **Public** access so assets can be served via CDN.
3. Configure storage policies to allow authenticated uploads and public reads. Run the SQL below in the Supabase SQL editor (repeat for both buckets by adjusting the `bucket_id`):

```sql
-- Public read access
create policy "Public read organization logos" on storage.objects
  for select using (bucket_id = 'organization-logos');

create policy "Public read user avatars" on storage.objects
  for select using (bucket_id = 'user-avatars');

-- Authenticated users can upload or replace files
create policy "Authenticated upload organization logos" on storage.objects
  for insert with check (
    bucket_id = 'organization-logos' and auth.role() = 'authenticated'
  );

create policy "Authenticated upload user avatars" on storage.objects
  for insert with check (
    bucket_id = 'user-avatars' and auth.role() = 'authenticated'
  );

create policy "Authenticated update organization logos" on storage.objects
  for update using (
    bucket_id = 'organization-logos' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'organization-logos'
  );

create policy "Authenticated update user avatars" on storage.objects
  for update using (
    bucket_id = 'user-avatars' and auth.role() = 'authenticated'
  ) with check (
    bucket_id = 'user-avatars'
  );

-- Authenticated users can delete existing files
create policy "Authenticated delete organization logos" on storage.objects
  for delete using (
    bucket_id = 'organization-logos' and auth.role() = 'authenticated'
  );

create policy "Authenticated delete user avatars" on storage.objects
  for delete using (
    bucket_id = 'user-avatars' and auth.role() = 'authenticated'
  );
```

> The application uses the Supabase service role for server-side uploads, which bypasses these policies. Creating them ensures dashboard access and any client-side tooling can still manage files securely.

### 4. Stripe Setup (Optional)

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Create products and prices for your plans
4. Set up webhook endpoints pointing to `/api/webhooks/stripe`
5. Configure webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 5. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Project Structure

```
├── /app
│   ├── /auth (login/signup)
│   │   └── /post-login (post-auth redirect resolver)
│   ├── /setup (organization onboarding)
│   ├── /[tenant] (tenant-specific routes)
│   │   ├── /dashboard
│   │   ├── /profile (user profile & settings)
│   │   ├── /team (team management)
│   │   ├── /billing
│   │   ├── /settings (organization settings)
│   │   ├── /analytics (placeholder)
│   │   ├── /api-keys (placeholder)
│   │   └── /webhooks (placeholder)
│   └── /api (API routes)
│       ├── /auth (authentication endpoints)
│       ├── /organizations (organization management)
│       └── /webhooks (webhook handlers)
├── /components
│   ├── /ui (shadcn components)
│   ├── /tenant (tenant-specific components: Navbar, Sidebar, OrganizationSwitcher)
│   ├── /organization (organization components: LogoUpload, DeleteOrganizationDialog)
│   ├── /profile (profile components: ChangePasswordDialog, Enable2FADialog, etc.)
│   ├── /team (team components: TeamMemberCard, TransferOwnershipDialog)
│   ├── /providers (React providers)
│   └── theme-initializer.tsx (Theme persistence component)
├── /features (modular feature system)
│   ├── /billing
│   ├── /analytics
│   ├── /notifications
│   ├── /api-keys
│   └── /webhooks
├── /lib
│   ├── auth.ts (NextAuth configuration)
│   ├── supabase.ts (Supabase client)
│   ├── tenant.ts (tenant utilities)
│   ├── stripe.ts (Stripe integration)
│   ├── storage.ts (Supabase Storage utilities)
│   ├── email.ts (Email templates and sending)
│   ├── permissions.ts (role-based access)
│   ├── form-schema.ts (Zod validation schemas)
│   └── translations.ts (i18n translations)
├── /config
│   └── features.config.ts (feature flags)
├── /middleware.ts (subdomain routing)
└── /supabase
    ├── /migrations (SQL migrations)
    └── /policies (RLS policies)
```

## Feature Configuration

The scaffolding uses a feature flag system to enable/disable modules:

```typescript
// config/features.config.ts
export const featuresConfig = {
  billing: {
    enabled: false, // Set to true to enable billing
    name: 'Billing',
    description: 'Stripe billing and subscription management',
  },
  analytics: {
    enabled: false, // Set to true to enable analytics
    name: 'Analytics',
    description: 'Usage tracking and analytics',
  },
  // ... other features
};
```

## Customization

### Adding New Features

1. Create feature module in `/features/[feature-name]/`
2. Add feature configuration in `/config/features.config.ts`
3. Create API routes in `/app/api/[feature-name]/`
4. Add UI components and pages

### Theming

The scaffolding includes a fully functional theme system:
- **Theme Options**: Light, Dark, and System (follows OS preference)
- **Persistence**: Theme preference saved in database and persists across browsers/sessions
- **Organization Logos**: Upload custom logos that appear in navbar (stored in Supabase Storage)
- **Default Logo**: Set `NEXT_PUBLIC_DEFAULT_LOGO_URL` environment variable for fallback logo
- **Customization**: 
  - Edit `src/styles/globals.css` for global styles
  - Use Tailwind CSS classes for component styling
  - Leverage shadcn/ui component variants

### Database Modifications

1. Create new migration files in `/supabase/migrations/`
2. Update RLS policies in `/supabase/policies/`
3. Update TypeScript types in `/lib/supabase.ts`

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your production environment:
- All Supabase variables
- NextAuth variables with production URLs
- Stripe production keys
- Google OAuth production credentials

## Authentication Flow

1. **Sign Up**: User creates account → email verification required
2. **Organization Setup**: User creates organization → becomes owner automatically
3. **Sign In**: User signs in → automatically redirected to organization dashboard (or setup if no orgs)
4. **Multi-tenant**: Users can belong to multiple organizations with different roles
5. **Session Management**: Theme preferences and user data loaded automatically on login

## Role-Based Access Control

- **Owner**: 
  - Full control over organization, billing, user management
  - Can transfer ownership to another member (becomes Admin after transfer)
  - Can delete organization
  - Cannot remove themselves from organization
  - Can only delete account if not owner of any organization
- **Admin**: 
  - Can manage users (invite, remove, change roles - except owners)
  - Can access organization settings and upload logo
  - Cannot access billing or delete organization
- **Member**: 
  - Read-only access to organization data
  - Can view team members and invitations
  - Cannot manage users or settings

### Organization Rules
- Each organization must have exactly one owner
- Only the owner can delete the organization
- Ownership transfer sends email notification to new owner
- Owner cannot demote themselves (must transfer ownership first)

## API Routes

### Authentication
- `/api/auth/[...nextauth]` - NextAuth.js endpoints
- `/api/auth/signup` - User registration
- `/api/auth/get-user-orgs` - Get user organizations (for login redirect)

### Organizations
- `/api/organizations` - Organization CRUD operations
- `/api/organizations/[organizationId]/logo` - Upload organization logo (POST) and delete (DELETE)

### Webhooks
- `/api/webhooks/stripe` - Stripe webhook handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the example implementations

## Key Features Details

### User Profile & Settings
- **Profile Management**: Update name, view email, account creation date, last login
- **Security**: Change password with strength validation, enable/disable 2FA (mocked)
- **Preferences**: 
  - Theme selection (Light/Dark/System) with cross-browser persistence
  - Language preferences (pt-BR, en-US)
- **Account Management**: Delete account (restricted if user is owner of any organization)

### Organization Settings
- **Logo Upload**: Upload custom organization logos (PNG, JPG, GIF, SVG, WebP)
- **Logo Display**: Logo appears in top-left corner of all tenant pages
- **Organization Deletion**: Owner can delete organization (requires confirmation)
- **Settings Access**: Only owners and admins can access organization settings

### Team Management
- **Member Invitations**: Send email invitations to join organization
- **Role Management**: Change member roles (owner/admin/member)
- **Member Removal**: Remove members (with restrictions based on role)
- **Ownership Transfer**: Owner can transfer ownership to another member
- **Email Notifications**: Automatic emails for invitations and ownership transfers

## Roadmap

- ✅ **Email invitation system** - Team member invitations with email verification
- ✅ **User Profile & Settings** - Complete profile management with 2FA, theme, and preferences
- ✅ **Organization Management** - Logo upload, settings, and organization deletion
- ✅ **Theme Persistence** - Theme preference saved across sessions and browsers
- ✅ **Ownership Transfer** - Transfer organization ownership with email notifications
- [ ] Advanced analytics dashboard
- [ ] API documentation
- [ ] Advanced billing features (usage limits, plan management)
- [ ] Mobile app support
- [ ] White-label customization
- [ ] Organization export/import