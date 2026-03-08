# Haven Hub — Setup Guide

Full-stack luxury vacation rental platform built with React + TypeScript + Supabase + Stripe.

---

## Requirements

| Tool | Install |
|---|---|
| Node.js 18+ | [nodejs.org](https://nodejs.org) |
| npm / bun | bundled with Node or `brew install bun` |
| Supabase CLI | `brew install supabase/tap/supabase` |
| A Supabase account | [supabase.com](https://supabase.com) — free plan works |
| A Stripe account | [stripe.com](https://stripe.com) |

---

## 1. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

Open `.env` and fill in your values (see Section 2 for where to find them).

```bash
# Start development server
npm run dev        # → http://localhost:8080

# Build for production
npm run build
```

---

## 2. Environment Variables

Edit `.env` with your project credentials:

### Supabase (required)

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Create a new project (or open an existing one)
3. Navigate to **Project Settings → API**
4. Copy:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | "Project URL" |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | "Project API keys → anon public" |
| `VITE_SUPABASE_PROJECT_ID` | The ref in your URL, e.g. `abcdefghijklmnop` |

### Stripe (required for bookings)

1. Go to **[Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)**
2. Copy the **Publishable key** (`pk_live_...` or `pk_test_...` for testing):

| Variable | Value |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your publishable key |

---

## 3. Backend Setup (Supabase)

Run the automated setup script — it links your project, runs all migrations, and deploys all 22 edge functions:

```bash
# Login to Supabase CLI
supabase login

# Run the full setup
bash scripts/setup.sh
```

### What the script does

| Step | Description |
|---|---|
| Links project | Reads `VITE_SUPABASE_URL` from `.env` to find your project ref |
| Runs migrations | Applies 60+ migration files to create all database tables |
| Deploys functions | Deploys all 22 serverless edge functions |

### Manual alternative

If you prefer to run steps individually:

```bash
# Link to your project
supabase link --project-ref <your-project-ref>

# Apply database schema
supabase db push

# Deploy all edge functions at once
supabase functions deploy --no-verify-jwt
```

---

## 4. Edge Function Secrets

Edge functions need server-side secrets. Set these via the Supabase Dashboard (**Edge Functions → Manage Secrets**) or CLI:

```bash
# Stripe (required for payments)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# AI content generation (required for /admin/ai-content)
supabase secrets set OPENAI_API_KEY=sk-...

# PMS integrations (optional — only if using)
supabase secrets set ADVANCECM_API_KEY=...
supabase secrets set GUESTY_API_KEY=...
supabase secrets set PMS_WEBHOOK_SECRET=...
```

### Secrets reference

| Secret | Required | Used by |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | `create-checkout-session`, `confirm-payment`, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `stripe-webhook` |
| `OPENAI_API_KEY` | For AI features | `generate-content`, `generate-image`, `suggest-icon` |
| `ADVANCECM_API_KEY` | For Tokeet/AdvanceCM | `advancecm-sync`, `pms-sync-cron` |
| `GUESTY_API_KEY` | For Guesty | `guesty-sync` |
| `PMS_WEBHOOK_SECRET` | For PMS webhooks | `pms-webhook` |

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected into every edge function by Supabase — you do not need to set these manually.

---

## 5. Stripe Webhook

Register your Supabase edge function as a Stripe webhook endpoint:

1. Go to **[Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)**
2. Click **Add endpoint**
3. Set the URL to:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the **Signing secret** (`whsec_...`) and set it:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 6. First Admin User

After the database is set up, create your first admin user:

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Invite user** (or create one)
3. Then in the **SQL Editor**, run:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<paste-user-uuid-here>', 'admin');
```

Now log in at `/login` and visit `/admin` to access the dashboard.

---

## 7. Brand Configuration

After logging in as admin:

1. Go to **`/admin/settings`**
2. Set your brand name, logo, colors, and contact info
3. Go to **`/admin/navigation`** to configure header/footer style
4. Add properties at **`/admin/properties`**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Tailwind)        │
│  • 20 public pages + 30+ admin pages             │
│  • Stripe.js for payment UI                      │
│  • React Query for data fetching                 │
│  • Supabase real-time subscriptions              │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  Supabase Backend                                │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ PostgreSQL DB    │  │ 22 Edge Functions     │  │
│  │ • 35+ tables    │  │ • Stripe payments     │  │
│  │ • Row-level sec │  │ • PMS sync            │  │
│  │ • Real-time     │  │ • AI generation       │  │
│  │ • 60+ migrations│  │ • Social publishing   │  │
│  └─────────────────┘  └──────────────────────┘  │
│  ┌─────────────────┐                             │
│  │ Auth (built-in) │                             │
│  │ • Email/password│                             │
│  │ • Session mgmt  │                             │
│  └─────────────────┘                             │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  External Services                               │
│  • Stripe — payments & webhooks                  │
│  • OpenAI — content generation                   │
│  • AdvanceCM/Tokeet — PMS sync                   │
│  • Guesty — PMS sync                             │
└─────────────────────────────────────────────────┘
```

---

## Useful Commands

```bash
npm run dev          # Start development server (port 8080)
npm run build        # Production build → dist/
npm run lint         # ESLint check
npm run test         # Run tests (Vitest)

supabase status      # Check local Supabase status
supabase db push     # Push migrations to remote
supabase functions deploy --no-verify-jwt   # Deploy all edge functions
supabase secrets list                        # View set secrets
supabase logs --function <name>             # View function logs
```
