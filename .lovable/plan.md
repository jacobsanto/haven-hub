

# Enable Leaked Password Protection

## Summary

This is a quick configuration change that enables password checking against the HaveIBeenPwned database during user signup and password changes. This prevents users from using passwords that have been exposed in known data breaches.

---

## What This Does

When enabled, the authentication system will:
1. Check new passwords against the HaveIBeenPwned breach database
2. Block users from setting passwords that appear in known data breaches
3. Display a user-friendly error message asking them to choose a different password

---

## Implementation

### Single Action Required

Use the authentication configuration tool to enable the HIBP (HaveIBeenPwned) integration:

**Setting to change:**
- `hibpEnabled`: `true`

This is a backend configuration change that requires no code modifications.

---

## User Experience

After enabling:
- **During signup**: If a user enters a breached password, they'll see an error asking them to choose a different password
- **During password change**: Same validation applies
- **Existing users**: Not affected until they change their password

---

## Technical Details

- The check is performed server-side by the authentication system
- Password hashes (k-anonymity prefix) are sent to HIBP API, not the actual password
- This adds minimal latency to signup/password change operations
- No additional secrets or API keys required

---

## Expected Outcome

After implementation:
- The security finding "HIBP_PASSWORD_PROTECTION" will be resolved
- Users cannot set passwords known to be compromised
- Enhanced security posture for all new accounts and password changes

