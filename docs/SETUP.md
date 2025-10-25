# Setup Guide

This guide will walk you through setting up the SaaS Multi-Tenant Scaffolding from scratch.

## Quick Start

### 1. Prerequisites

Before you begin, make sure you have:

- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- A [Supabase](https://supabase.com/) account
- A [Stripe](https://stripe.com/) account (for billing features)
- A [Google Cloud Console](https://console.cloud.google.com/) project (for Google OAuth)

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd saas-scaffolding
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy the environment template and fill in your values:

```bash
cp env.example .env.local
```

## Detailed Setup

### Supabase Configuration

#### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Wait for the project to be fully initialized
3. Go to Settings > API to get your project URL and keys

#### 2. Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- 1. Initial Schema (supabase/migrations/001_initial_schema.sql)
-- Copy and paste the entire content of this file

-- 2. RLS Policies (supabase/policies/rls_policies.sql)
-- Copy and paste the entire content of this file
```

#### 3. Authentication Setup

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL: `http://localhost:3000` (development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

#### 4. Row Level Security

The RLS policies are included in the migration files. Make sure they're applied correctly:

- All tables should have RLS enabled
- Policies should be created for each table
- Service role should have bypass permissions

### Stripe Configuration

#### 1. Create Stripe Account

1. Sign up at [Stripe](https://stripe.com/)
2. Complete account verification
3. Get your API keys from the dashboard

#### 2. Create Products and Prices

1. Go to Products in your Stripe dashboard
2. Create products for your plans:
   - Free Plan (if needed)
   - Pro Plan
   - Enterprise Plan
3. Create prices for each product
4. Note down the price IDs for your calendar variables

#### 3. Webhook Setup

1. Go to Webhooks in your Stripe dashboard
2. Create a new webhook endpoint
3. Set the URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook secret

### Email Configuration (Required)

This application uses Resend.com for email delivery. You'll need to set up Resend to enable email functionality:

#### 1. Resend Setup

1. Sign up for a free account at [resend.com](https://resend.com)
2. Verify your domain or use the sandbox domain for testing
3. Generate an API key from your dashboard

#### 2. Environment Variables

Add these to your `.env.local` file:

```bash
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_NAME="Your SaaS Name"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. Email Features

The system includes:
- Email verification for new accounts (mandatory before login)
- Password reset via magic links
- Two-factor authentication codes
- Account notifications

### Google OAuth Configuration (Optional)

#### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials and create OAuth 2.0 credentials

#### 2. OAuth Configuration

1. Set application type to "Web application"
2. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
3. Copy the client ID and client secret

**Note**: Google OAuth is optional. If you don't configure it, the Google sign-in buttons will not appear.

### Feature Configuration

#### 1. Enable/Disable Features

Edit `config/features.config.ts` to enable or disable features:

```typescript
export const featuresConfig = {
  billing: {
    enabled: true, // Enable billing features
    // ...
  },
  analytics: {
    enabled: false, // Disable analytics
    // ...
  },
  // ...
};
```

#### 2. Customize Features

Each feature module can be customized:
- Modify components in `/features/[feature]/components/`
- Update API routes in `/app/api/[feature]/`
- Customize configuration in feature files

## Development

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test the Application

1. Visit `http://localhost:3000`
2. Try creating an account
3. Test organization creation
4. Verify tenant routing works

### 3. Test Features

- Authentication (sign up, sign in, Google OAuth)
- Organization creation and management
- User roles and permissions
- Billing (if enabled)
- Tenant isolation

## Production Deployment

### 1. Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### 2. Environment Variables for Production

Make sure to set these in your production environment:

```env
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth Production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret

# Stripe Production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth Production
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

### 3. Domain Configuration

For subdomain routing to work in production:

1. Configure your DNS to point `*.yourdomain.com` to your hosting provider
2. Update your Supabase authentication settings with production URLs
3. Update Google OAuth redirect URIs with production URLs

## Troubleshooting

### Common Issues

#### 1. Authentication Issues

- Check that all environment variables are set correctly
- Verify Supabase authentication settings
- Ensure redirect URLs are configured properly

#### 2. Database Issues

- Verify that migrations have been run
- Check that RLS policies are applied correctly
- Ensure service role key has proper permissions

#### 3. Stripe Issues

- Verify webhook endpoint is accessible
- Check that webhook events are configured correctly
- Ensure API keys are for the correct environment (test/live)

#### 4. Tenant Routing Issues

- Check that middleware is configured correctly
- Verify subdomain DNS configuration
- Ensure tenant detection logic is working

### Getting Help

1. Check the logs in your browser console
2. Review server logs in your hosting provider
3. Check Supabase logs in the dashboard
4. Verify Stripe webhook delivery in the dashboard
5. Create an issue in the repository

## Next Steps

After setup is complete:

1. Customize the UI and branding
2. Add your specific business logic
3. Configure additional features as needed
4. Set up monitoring and analytics
5. Plan your go-to-market strategy

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **API Keys**: Use different keys for development and production
3. **RLS Policies**: Regularly review and update database policies
4. **Authentication**: Implement proper session management
5. **Webhooks**: Verify webhook signatures in production

## Performance Optimization

1. **Database**: Optimize queries and add indexes as needed
2. **Caching**: Implement caching strategies for frequently accessed data
3. **CDN**: Use a CDN for static assets
4. **Monitoring**: Set up performance monitoring and alerting

## Maintenance

1. **Updates**: Regularly update dependencies
2. **Security**: Keep security dependencies up to date
3. **Monitoring**: Monitor application performance and errors
4. **Backups**: Implement database backup strategies
5. **Documentation**: Keep documentation up to date
