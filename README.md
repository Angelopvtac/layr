# Layr — Plain Words → Shipped Apps

Layr is a friendly layer between people and code. Users describe what they want; Layr interprets intent, chooses a blueprint, provisions backends, scaffolds code, deploys, and verifies—no dev jargon required.

## 🚀 Quickstart

```bash
# Install dependencies
pnpm install

# Run UI wizard
pnpm --filter @layr/ui dev

# Or run end-to-end from example
pnpm --filter @layr/cli run examples/subscription-projects.json
```

## 📝 Environment Setup

Copy `.env.example` to `.env.local` and add your credentials:

```bash
cp .env.example .env.local
```

Use LAYR_* prefixed environment variables:
- `LAYR_SUPABASE_*` - Supabase credentials
- `LAYR_CLERK_*` - Clerk auth settings
- `LAYR_STRIPE_*` - Stripe payment keys
- `LAYR_VERCEL_*` - Vercel deployment config

MCP is optional: set `MCP_ENABLED=1` to use MCP servers, otherwise SDK/CLI fallbacks are used.

## 🏗️ Architecture

### Packages
- **`@layr/core`** - Intent schema, blueprint chooser, smoke tests
- **`@layr/agent`** - AI prompts and orchestration runner
- **`@layr/mcp`** - Unified adapters for MCP and SDK/CLI
- **`@layr/cli`** - Command-line interface

### Blueprints
- **`saas-starter`** - Full SaaS with auth, payments, CRUD
- **`form-to-db`** - Public forms that save to database
- **`community-mini`** - Simple community with posts/comments
- **`marketplace-lite`** - Basic marketplace with listings
- **`static-landing`** - Marketing landing with waitlist

### Apps
- **`layr-ui`** - Web wizard for generating intents

## 🔧 Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Development mode
pnpm dev
```

## 📦 CLI Commands

```bash
# Initialize from intent
layr init <intent.json>

# Provision backends (Supabase, Stripe, etc)
layr provision

# Deploy to Vercel
layr deploy

# Run smoke tests
layr verify

# End-to-end (init → provision → deploy → verify)
layr run <intent.json>
```

## 🎯 How It Works

1. **Describe** - User describes what they want in plain English
2. **Interpret** - Layr converts request to structured intent
3. **Choose** - System selects best blueprint for the use case
4. **Provision** - Creates and configures backend services
5. **Scaffold** - Generates working application code
6. **Deploy** - Pushes to production with preview URL
7. **Verify** - Runs smoke tests to ensure everything works

## 📚 Examples

See the `examples/` directory for sample intent files:
- `subscription-projects.json` - SaaS with project management
- `simple-form.json` - Basic email collection form

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT © Layr Contributors

---

**Tagline:** Plain words → shipped apps