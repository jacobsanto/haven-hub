

# Plan: Generate & Update PMS Webhook Token

## Overview

Generate a cryptographically secure token for authenticating webhook requests from AdvanceCM to your Haven Hub backend, then update the stored secret.

---

## What Will Happen

### Step 1: Generate Secure Token

I'll create a 32-character random token using a cryptographically secure method. The token will:
- Be URL-safe (no special characters that need encoding)
- Be sufficiently long to prevent brute-force attacks
- Look something like: `hh_wh_a7Bx9Kp2mN4qR6sT8uW0yZ3cE5gI`

### Step 2: Update Backend Secret

I'll update the `PMS_WEBHOOK_TOKEN` secret in your backend so the edge function can validate incoming webhooks.

### Step 3: Provide Your Complete Webhook URL

Once updated, your complete webhook URL will be:

```text
https://xavjbiuhcmupsoocrmhf.supabase.co/functions/v1/pms-webhook?token=YOUR_NEW_TOKEN
```

I'll give you the exact URL with the token included, ready to paste into AdvanceCM's Message Automation configuration.

---

## Security Notes

- The token will only be shown to you once - save it securely
- Never share the full webhook URL publicly
- The token provides authentication since AdvanceCM/Tokeet doesn't support HMAC webhook signing

---

## After Approval

Once you approve this plan, I will:
1. Generate the token
2. Update the secret (you'll see a confirmation prompt)
3. Provide the complete webhook URL for AdvanceCM

