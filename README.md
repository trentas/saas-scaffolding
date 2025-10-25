# SaaS Multi-Tenant Scaffolding

A production-ready multi-tenant SaaS scaffolding built with Next.js 15, Supabase, Stripe, and shadcn/ui. This template provides a solid foundation for building scalable multi-tenant SaaS applications.

## Features

### Core Features
- ✅ **Multi-tenant Architecture** - Subdomain-based tenant routing (`company.app.com`)
- ✅ **Secure Authentication** - NextAuth.js with email verification, password reset, and 2FA
- ✅ **User Management** - Role-based access control (owner/admin/member)
- ✅ **Database** - Supabase with Row Level Security (RLS) policies
- ✅ **Billing** - Stripe integration for subscriptions and payments
- ✅ **Email System** - Resend.com integration for verification and notifications
- ✅ **Security Features** - Account locking, strong passwords, session management
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

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe Configuration (Required for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# App Configuration (Optional)
NEXT_PUBLIC_APP_NAME="My SaaS"
NEXT_PUBLIC_APP_URL=https://app.example.com
```

### 3. Database Setup

#### Supabase Setup

1. Create a new Supabase project
2. Run the migration files in order:
   ```sql
   -- Run these in your Supabase SQL editor
   -- 1. Initial schema
   -- File: supabase/migrations/001_initial_schema.sql
   
   -- 2. RLS policies
   -- File: supabase/policies/rls_policies.sql
   ```

3. Enable Row Level Security on all tables
4. Set up authentication providers in Supabase dashboard

#### Database Schema

The scaffolding includes these main tables:
- `organizations` - Tenant data with slug, plan, settings
- `users` - User profiles
- `organization_members` - User-organization relationships with roles
- `invitations` - Email invitations with tokens
- `subscriptions` - Stripe subscription data

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
│   ├── /setup (organization onboarding)
│   ├── /[tenant] (tenant-specific routes)
│   │   ├── /dashboard
│   │   ├── /profile
│   │   ├── /team
│   │   ├── /billing
│   │   └── /settings
│   └── /api (API routes)
├── /components
│   ├── /ui (shadcn components)
│   ├── /tenant (tenant-specific components)
│   └── /providers (React providers)
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
│   └── permissions.ts (role-based access)
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

The scaffolding uses the Mainline template's theme system:
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

1. **Sign Up**: User creates account → redirected to organization setup
2. **Organization Setup**: User creates organization → becomes owner
3. **Sign In**: User signs in → redirected to organization dashboard
4. **Multi-tenant**: Users can belong to multiple organizations

## Role-Based Access Control

- **Owner**: Full control over organization, billing, user management
- **Admin**: Can manage users and settings, cannot access billing
- **Member**: Read-only access to organization data

## API Routes

- `/api/auth/signup` - User registration
- `/api/organizations` - Organization management
- `/api/webhooks/stripe` - Stripe webhook handling
- `/api/auth/[...nextauth]` - NextAuth.js endpoints

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

## Roadmap

- [ ] Email invitation system
- [ ] Advanced analytics dashboard
- [ ] API documentation
- [ ] Mobile app support
- [ ] White-label customization
- [ ] Advanced billing features
- [ ] Multi-language support