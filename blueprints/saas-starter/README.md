# SaaS Starter Blueprint

Complete SaaS starter with authentication, payments, and database.

## Features

- **Authentication**: Clerk for user management
- **Payments**: Stripe integration with subscription handling
- **Database**: Supabase with Row Level Security
- **UI**: shadcn/ui components with Tailwind CSS
- **Framework**: Next.js 14 with App Router

## Structure

```
├── app/
│   ├── (auth)/         # Authentication pages
│   ├── (marketing)/    # Public pages
│   ├── dashboard/      # User dashboard
│   └── api/           # API routes
├── components/
│   ├── ui/            # shadcn/ui components
│   └── features/      # Feature components
├── lib/
│   ├── supabase/      # Database client
│   ├── stripe/        # Payment utilities
│   └── utils/         # Helpers
└── public/            # Static assets
```

## Environment Variables

Required environment variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

## Database Schema

The blueprint includes migrations for:

- Users table (synced with Clerk)
- Organizations table
- Subscriptions table
- Invoices table
- Activity logs

## Pricing Plans

Pre-configured pricing tiers:

- **Free**: Basic features
- **Pro**: $19/month - Advanced features
- **Team**: $49/month - Team collaboration
- **Enterprise**: Custom pricing

## Getting Started

1. Install dependencies: `pnpm install`
2. Set up environment variables
3. Run migrations: `layr migrate`
4. Start development: `pnpm dev`