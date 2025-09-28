# Layr — One-Prompt Monorepo Scaffold (Markdown Version)

> **Purpose:** Paste this whole file into **Claude Code** (or any coding agent). It will scaffold **Layr**—a layer that turns plain-English requests into working apps by interpreting intent → choosing a blueprint → provisioning backends (Supabase, Clerk, Stripe, Vercel) → scaffolding code → deploying → smoke-testing.
> **Constraints:** Works with or without MCP. No Docker required. Production-ready minimal implementations (no TODOs in core paths).

---

## Global Rules

* Stack: **pnpm + Turborepo**, TypeScript everywhere, Next.js 14 App Router, Tailwind, shadcn/ui.
* Create clean, compile-ready code. Provide minimal but working implementations.
* Every file change must be committed with short Aider-style messages: `<scope>: <imperative>`.
* Secrets only in `.env.local` (gitignored) or Vercel env vars. Never commit secrets.
* Provide MCP adapters **and** fallback SDK/CLI code paths (so Layr runs even if MCP isn’t available).
* Include a tiny **non-dev UI wizard** to generate intent JSON and kick off `init → provision → deploy → verify`.
* Provide **Playwright** smoke tests and **Vitest** unit tests where noted.
* License: **MIT**.

---

## Repository Layout

```
layr/
├─ apps/
│  ├─ layr-ui/                 # Non-dev wizard + status dashboard (Next.js)
│  └─ sandbox/                 # WebContainer-friendly playground (optional)
├─ packages/
│  ├─ core/                    # intent schema, guards, blueprint chooser, smoke tests
│  ├─ agent/                   # interpreter/planner/implementer/verifier prompts + runner
│  ├─ mcp/                     # MCP clients + fallbacks for vercel/supabase/stripe/clerk + git/fs/http
│  └─ cli/                     # layr CLI (init/provision/deploy/verify/run)
├─ blueprints/
│  ├─ saas-starter/            # Next.js + Supabase + Clerk + Stripe + Resend (full scaffold)
│  ├─ form-to-db/              # public form → DB rows (no auth)
│  ├─ community-mini/          # auth + posts + comments
│  ├─ marketplace-lite/        # listings + checkout
│  └─ static-landing/          # waitlist + stripe links
├─ ops/
│  ├─ policies/                # GIT.md, SECURITY.md
│  ├─ scripts/                 # provision.sh, teardown.sh
│  └─ ci/                      # GitHub Actions
├─ examples/
│  ├─ subscription-projects.json
│  └─ simple-form.json
├─ .env.example
├─ package.json
├─ turbo.json
└─ README.md
```

Create a **root** `package.json`:

```json
{
  "name": "layr",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.6.3",
    "prettier": "^3.3.3",
    "eslint": "^9.10.0"
  }
}
```

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "outputs": [] }
  }
}
```

Root `.gitignore` should include standard Node/Next/Vercel ignores and `.env*`.

---

## `packages/core`

### Intent Schema — `packages/core/intent.schema.json`

```json
{
  "$id": "https://layr.dev/intent.schema.json",
  "type": "object",
  "required": ["goal", "audience", "capabilities"],
  "properties": {
    "goal": { "type": "string" },
    "audience": { "type": "string", "enum": ["personal", "community", "business", "nonprofit", "education"] },
    "capabilities": { "type": "array", "items": { "type": "string" } },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "fields"],
        "properties": {
          "name": { "type": "string" },
          "fields": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": { "type": "string" },
                "type": { "type": "string", "enum": ["string", "text", "number", "boolean", "date", "email", "url", "image", "json"] },
                "required": { "type": "boolean", "default": false }
              }
            }
          }
        }
      }
    },
    "auth": { "type": "string", "enum": ["none", "magic_link", "social_login", "email_password"], "default": "magic_link" },
    "payments": {
      "type": "object",
      "properties": {
        "model": { "type": "string", "enum": ["none", "one_time", "subscription", "usage"], "default": "none" },
        "plans": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "priceMonthly": { "type": "number" },
              "features": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    },
    "brand": { "type": "object", "properties": { "name": { "type": "string" }, "tagline": { "type": "string" } } },
    "nonGoals": { "type": "array", "items": { "type": "string" } }
  }
}
```

### Blueprint Chooser — `packages/core/blueprint-chooser.ts`

```ts
export function chooseBlueprint(intent: any) {
  const caps = new Set(intent.capabilities || []);
  if (intent.payments?.model && intent.payments.model !== "none") return "saas-starter";
  if (caps.has("collect_data") && !caps.has("auth")) return "form-to-db";
  if (caps.has("community") || caps.has("notifications")) return "community-mini";
  if (caps.has("crud") && caps.has("auth")) return "marketplace-lite";
  return "static-landing";
}
```

### Tests (Vitest) — `packages/core/blueprint-chooser.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { chooseBlueprint } from "./blueprint-chooser";

describe("chooser", () => {
  it("saas when payments", () =>
    expect(chooseBlueprint({ payments: { model: "subscription" } })).toBe("saas-starter"));
  it("form-to-db when collect only", () =>
    expect(chooseBlueprint({ capabilities: ["collect_data"] })).toBe("form-to-db"));
});
```

### Smoke Tests (Playwright) — `packages/core/smoke.spec.ts`

```ts
import { test, expect } from "@playwright/test";
const url = process.env.LAYR_PREVIEW_URL!;

test("home 200", async ({ page }) => {
  await page.goto(url);
  await expect(page).toHaveTitle(/.+/);
});

test("auth flow (if present)", async ({ page }) => {
  if (!process.env.LAYR_HAS_AUTH) test.skip();
  await page.goto(url + "/sign-in");
  await expect(page.getByRole("heading", { name: /sign/i })).toBeVisible();
});
```

---

## `packages/agent`

### Prompts

Create these files:

* `packages/agent/prompts/interpreter.md`

```
SYSTEM
You are the INTERPRETER for Layr. Convert a casual user request into STRICT JSON
matching intent.schema.json. Default to simple choices when ambiguous.
Never mention code, frameworks, containers, or infra. Infer 1–3 entities.
If payments are requested, generate 1–3 simple plans. OUTPUT JSON ONLY.
```

* `packages/agent/prompts/planner.md`

```
SYSTEM
You are the PLANNER. Given {INTENT_JSON} and selected blueprint {BLUEPRINT_ID},
produce a small TASK_GRAPH (YAML) for: init_repo → provision_backends → config_env
→ scaffold_pages → commit_preview → deploy_prod → verify_smoke. Include artifacts:
preview_url, admin_credentials (if any).
```

* `packages/agent/prompts/implementer.md`

```
SYSTEM
You are the IMPLEMENTER. Execute TASK_GRAPH via MCP tools if available, else via Node SDKs/CLIs.
Rules:
- Each file edit → git.commit "<scope>: <change>"
- Secrets to .env.local or Vercel env (never commit)
- After config changes → create preview and report URL
- On failure retry once, then fallback safely
```

* `packages/agent/prompts/verifier.md`

```
SYSTEM
You are the VERIFIER. Run smoke checks:
- GET preview_url returns 200
- If auth: sign-in page reachable
- If CRUD: create/read/update one item
- If payments: Stripe test checkout starts and returns success page
Report PASS/FAIL with failing routes.
```

### Runner Stub — `packages/agent/index.ts`

Implement a small orchestrator to load prompts, call adapters, and run steps (no external model calls required for the stub). Keep it reusable by the CLI.

---

## `packages/mcp`

Create **unified adapters** exposing identical functions with or without MCP:

`packages/mcp/index.ts` (outline)

```ts
export const git = { init, commit, branch, openPr };
export const fsx = { writeFile, readFile, exists, glob };
export const vercel = { createProject, setEnv, deploy, previewUrl };
export const supabase = { createProject, sql, enableAuth };
export const stripe = { ensureProduct, ensurePrices, customerPortalLink };
export const clerk = { createInstance, enableProviders };

/** Detect MCP via env flag; otherwise use SDK/CLI fallbacks. Minimal working versions:
 * - vercel: @vercel/client or shell `npx vercel ...`
 * - supabase: supabase-js admin or REST
 * - stripe: stripe-node
 * - clerk: Clerk API
 * - git/fs: simple-git + fs/promises
 */
```

Provide concise, working implementations and environment variable loading. Don’t commit secrets.

---

## `packages/cli`

* Binary name: **`layr`** (add `bin` field in package.json).
* Use `commander` for CLI.

**Commands:**

* `layr init <intent.json>` → choose blueprint + scaffold to `apps/generated`.
* `layr provision` → call adapters (Supabase/Stripe/Clerk/Vercel) and write `.env.local`.
* `layr deploy` → create Vercel project (if not existing) + set env + deploy; print **preview URL**.
* `layr verify` → run Playwright tests with `LAYR_PREVIEW_URL`.
* `layr run <intent.json>` → end-to-end: init → provision → deploy → verify.

Ensure console output is **plain-English** status messages.

---

## `apps/layr-ui` (Next.js 14)

**Pages:**

* `/` — hero + **Wizard** (3 steps) → builds `intent` JSON
* `/build` — POST to `/api/run` triggering CLI pipeline (spawn child process)
* `/status` — tail logs from `./.layr/logs` and show current step

**API routes:**

* `POST /api/run` → executes `layr run` with uploaded `intent.json`
* `GET /api/status` → returns recent log lines
* `GET /api/preview` → returns preview URL if present (read from `.layr/preview_url`)

**Wizard fields:**

* “What do you want to do?” (free text → `goal`)
* “Who’s this for?” (personal/community/business/nonprofit/education → `audience`)
* Toggles: “Need login?”, “Need payments?”, “Data you want to store” (adds `capabilities` + `entities`)

Include Tailwind + shadcn. A **“Build my app”** button calls `/api/run`. Show progress and the preview URL when ready.

---

## `blueprints`

### `blueprints/saas-starter/` (minimal, working)

* **Stack:** Next.js 14, TS, Tailwind, shadcn/ui, Supabase (RLS), Clerk (magic link + Google), Stripe (subs), Resend (emails), Vercel (deploy).
* **Features:**

  * Auth pages (Clerk) + protected `/app`
  * CRUD example: `/app/projects` (title, description, status)
  * Pricing page `/pricing` with 2 plans; Stripe checkout & webhook `/api/webhooks/stripe`
  * Env template `.env.template` with `LAYR_` prefixes
  * DB migrations in `db/migrations/000_init.sql` (profiles, projects with RLS)

**Key code to include:**

* `src/app/(auth)/sign-in/...` and middleware to protect `/app/*`
* `src/app/app/projects` pages (list/new/edit via server actions)
* `src/app/pricing/page.tsx` with Stripe checkout
* `src/app/api/webhooks/stripe/route.ts` verifying test events
* `src/lib/supabase.ts`, `src/lib/stripe.ts`
* `src/middleware.ts` (if using Clerk’s middleware)

**Migration — `db/migrations/000_init.sql`**

```sql
create extension if not exists pgcrypto;

create table public.profiles(
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  role text not null default 'user',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "owner read" on public.profiles
for select using (auth.uid() = user_id);

create table public.projects(
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  title text not null,
  description text,
  status text default 'new',
  created_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "owner crud" on public.projects
using (owner = auth.uid()) with check (owner = auth.uid());
```

### Other Blueprints

Provide minimal **working** scaffolds so the chooser always produces something usable:

* `form-to-db/` — single public form + Supabase table + public insert RPC.
* `community-mini/` — auth + posts + comments (very small).
* `marketplace-lite/` — listing + checkout skeleton.
* `static-landing/` — marketing page + waitlist form + Stripe links.

---

## `ops`

### `ops/policies/GIT.md`

* Branches: `main` (prod), `dev` (staging), feature branches per run.
* Commit style: `<scope>: <imperative>` (e.g., `auth: add Clerk + routes`).
* Every stage ends with a commit and a **Vercel preview**.

### `ops/policies/SECURITY.md`

* Block obvious abuse (phishing/scam templates, mass-spam).
* Require domain verification before outbound email.
* Stripe: test mode only until custom domain verified.

### Scripts

* `ops/scripts/provision.sh` — call adapters (Supabase/Stripe/Clerk/Vercel) and write envs.
* `ops/scripts/teardown.sh` — optional delete resources.

### CI

* `ops/ci/preview.yml` — GitHub Actions: install, build, run `layr verify` against a preview URL (taken from action input or artifact).

---

## `examples`

Create the following:

**`examples/subscription-projects.json`**

```json
{
  "goal": "Clients log in, create projects, and pay monthly",
  "audience": "business",
  "capabilities": ["auth", "crud", "payments", "email"],
  "entities": [
    {
      "name": "Project",
      "fields": [
        { "name": "title", "type": "string", "required": true },
        { "name": "description", "type": "text" },
        { "name": "status", "type": "string" }
        ]
    }
  ],
  "auth": "magic_link",
  "payments": {
    "model": "subscription",
    "plans": [
      { "name": "Starter", "priceMonthly": 9, "features": ["1 project", "Email support"] },
      { "name": "Pro", "priceMonthly": 29, "features": ["Unlimited projects", "Priority support"] }
    ]
  },
  "brand": { "name": "Projectify", "tagline": "Projects, simplified." }
}
```

**`examples/simple-form.json`**

```json
{
  "goal": "Collect emails and a short message from visitors",
  "audience": "business",
  "capabilities": ["collect_data"],
  "entities": [
    {
      "name": "Submission",
      "fields": [
        { "name": "email", "type": "email", "required": true },
        { "name": "message", "type": "text" }
      ]
    }
  ],
  "auth": "none",
  "payments": { "model": "none" }
}
```

---

## README (Top-Level)

Add a concise README:

```md
# Layr — plain words → shipped apps

Layr is a friendly layer between people and code. Users describe what they want; Layr interprets intent, chooses a blueprint, provisions backends, scaffolds code, deploys, and verifies—no dev jargon required.

## Quickstart
pnpm i
# run UI wizard
pnpm --filter @layr/ui dev
# or run end-to-end from example
pnpm --filter @layr/cli run examples/subscription-projects.json

## Environment
Use LAYR_*-prefixed env vars:
- LAYR_SUPABASE_*
- LAYR_CLERK_*
- LAYR_STRIPE_*
- LAYR_VERCEL_*

MCP optional: if `MCP_ENABLED=1`, use MCP servers; else fall back to SDKs/CLIs.
```

Also create `.env.example` listing all required keys.

---

## Branding & Naming Conventions

* **Name:** Layr
* **Tagline:** “Plain words → shipped apps.”
* **CLI:** `layr`
* **NPM scope:** `@layr/*`
* **ENV prefix:** `LAYR_`
* **Design:** near-black, white, one accent; simple wordmark; “layer” icon (two offset rectangles).

---

## Acceptance Criteria (Agent Must Ensure)

1. `pnpm i` and `pnpm -w build` succeed.
2. `pnpm --filter @layr/cli run examples/subscription-projects.json` ends by printing a **preview URL**.
3. Playwright smoke tests in `packages/core` pass against that preview (`LAYR_PREVIEW_URL`).
4. `apps/layr-ui` wizard can generate an intent and trigger the end-to-end build.
5. Secrets are never committed; envs live in `.env.local` or Vercel env vars.
6. Lint & typecheck clean.

---

## Final Step (What to Do Now)

1. Initialize a new git repo in `layr/`.
2. Scaffold everything above, writing **working** code and minimal content where specified.
3. Generate `.env.example` listing all needed keys.
4. Provide a **single command** to try Layr end-to-end:

```bash
pnpm --filter @layr/cli run examples/subscription-projects.json
```

5. Print the preview URL clearly and store it in `.layr/preview_url` for the UI.
6. Output a brief **SUCCESS** summary with the URL and next steps.

---

**Build now. Do not ask any follow-up questions.**
