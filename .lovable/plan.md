
## Add Stripe Publishable Key to Environment

Add the live Stripe publishable key to the `.env` file for frontend Stripe initialization.

---

### Change Required

**File:** `.env`

Add the following line:
```
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_51L8ZiaCZ65TIMnxL0wzAH2YvEw1jc3zn3zE0bHvY9ESTWX6woo5Qlu27gsto523UiKMfmGwlovT7Fw6s6tNQ371Q00L2vGhZNR"
```

---

### What This Enables

Once added, the Stripe payment form in `src/lib/stripe.ts` will be able to initialize properly:

```typescript
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
stripePromise = loadStripe(publishableKey);
```

This allows:
- Card payment form rendering via Stripe Elements
- Apple Pay / Google Pay support
- Secure payment processing on checkout

---

### Note

This is a **publishable key** (starts with `pk_live_`), which is designed to be public and safe to include in frontend code. It can only be used to create tokens and cannot access your Stripe account data.
