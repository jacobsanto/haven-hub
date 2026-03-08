#!/usr/bin/env bash
# ============================================================
# Haven Hub — Supabase Backend Setup Script
# ============================================================
# Run this once to connect your Supabase project, push the
# database schema, and deploy all edge functions.
#
# Prerequisites:
#   - Supabase CLI installed  (brew install supabase/tap/supabase)
#   - Logged in               (supabase login)
#   - .env file configured    (copy .env.example → .env and fill in values)
# ============================================================

set -e

# ── Colours ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[info]${NC} $*"; }
success() { echo -e "${GREEN}[ok]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC} $*"; }
error()   { echo -e "${RED}[error]${NC} $*"; exit 1; }

echo ""
echo "================================================"
echo "  Haven Hub — Backend Setup"
echo "================================================"
echo ""

# ── Check prerequisites ───────────────────────────────────────
if ! command -v supabase &>/dev/null; then
  error "Supabase CLI not found. Install it: brew install supabase/tap/supabase"
fi
success "Supabase CLI found: $(supabase --version)"

if [ ! -f ".env" ]; then
  error ".env file not found. Copy .env.example to .env and fill in your values."
fi
success ".env file found"

# ── Load env vars ─────────────────────────────────────────────
source .env

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
  error "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env"
fi

# Extract project ref from URL: https://<ref>.supabase.co
PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')
info "Using project: $PROJECT_REF"

# ── Link to Supabase project ──────────────────────────────────
info "Linking to Supabase project..."
supabase link --project-ref "$PROJECT_REF"
success "Linked to project $PROJECT_REF"

# ── Push database migrations ──────────────────────────────────
info "Running database migrations..."
supabase db push
success "Database schema applied"

# ── Deploy all edge functions ─────────────────────────────────
FUNCTIONS=(
  advancecm-sync
  pms-sync-cron
  pms-webhook
  pms-generic-test
  pms-analyze-docs
  guesty-sync
  seasonal-rates-import
  generate-content
  generate-image
  suggest-icon
  scheduled-posts-cron
  social-publish
  social-analytics-sync
  create-checkout-session
  confirm-payment
  stripe-webhook
  verify-checkout-session
  exchange-rates
  website-analytics
  check-holds
  geocode-address
  destination-weather
)

info "Deploying edge functions..."
for fn in "${FUNCTIONS[@]}"; do
  if [ -d "supabase/functions/$fn" ]; then
    supabase functions deploy "$fn" --no-verify-jwt
    success "  Deployed: $fn"
  else
    warn "  Skipping (not found): $fn"
  fi
done

# ── Set required secrets ──────────────────────────────────────
echo ""
echo "================================================"
echo "  Required Secrets"
echo "================================================"
echo ""
echo "Set the following secrets in your Supabase project:"
echo "(Supabase Dashboard → Edge Functions → Manage Secrets)"
echo ""
echo "  STRIPE_SECRET_KEY          Your Stripe secret key (sk_live_... or sk_test_...)"
echo "  STRIPE_WEBHOOK_SECRET      Your Stripe webhook signing secret (whsec_...)"
echo "  OPENAI_API_KEY             OpenAI API key for AI content generation"
echo "  ADVANCECM_API_KEY          AdvanceCM/Tokeet API key (if using PMS sync)"
echo "  GUESTY_API_KEY             Guesty API key (if using Guesty PMS)"
echo "  PMS_WEBHOOK_SECRET         Webhook verification token for PMS events"
echo ""
echo "Or set them via CLI:"
echo "  supabase secrets set STRIPE_SECRET_KEY=sk_live_..."
echo ""

# ── Set Stripe webhook endpoint ───────────────────────────────
echo "================================================"
echo "  Stripe Webhook"
echo "================================================"
echo ""
echo "Register this URL as a Stripe webhook endpoint:"
echo "  ${VITE_SUPABASE_URL}/functions/v1/stripe-webhook"
echo ""
echo "Required events:"
echo "  payment_intent.succeeded"
echo "  payment_intent.payment_failed"
echo "  checkout.session.completed"
echo ""

echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Set the secrets listed above"
echo "  2. Register the Stripe webhook URL"
echo "  3. Run the app:  npm run dev"
echo ""
success "All done!"
