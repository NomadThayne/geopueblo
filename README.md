# geopueblo.com — OFAC Subscriber Check

Simple OFAC screening on subscriber signups using [SanctionsLookup](https://sanctionslookup.com) (free tier).

## File Overview

```
functions/
  api/
    subscribe.js        ← Cloudflare Pages Function (the backend)
src/
  components/
    SubscribeForm.astro ← Drop-in Astro form component
```

---

## Setup (5 steps)

### 1. Get a free SanctionsLookup API key
Go to https://sanctionslookup.com/register — no credit card required.

### 2. Add environment variable in Cloudflare Pages
In your Cloudflare dashboard:
  Pages → geopueblo → Settings → Environment variables → Add variable

| Variable                   | Value                  |
|----------------------------|------------------------|
| `SANCTIONS_LOOKUP_API_KEY` | your key from step 1   |
| `OFAC_MIN_SCORE`           | `85` (recommended)     |

### 3. Copy files into your repo
```
cp functions/api/subscribe.js    <your-repo>/functions/api/subscribe.js
cp src/components/SubscribeForm.astro <your-repo>/src/components/SubscribeForm.astro
```

### 4. Use the form in any Astro page
```astro
---
import SubscribeForm from '../components/SubscribeForm.astro';
---
<SubscribeForm />
```

### 5. Wire up your email provider
In `functions/api/subscribe.js`, find `proceedWithSubscription()` and replace the stub with
your actual provider (Mailchimp, ConvertKit, Resend, etc.).

---

## How it works

1. User submits first name, last name, email
2. Cloudflare Pages Function calls SanctionsLookup `/v1/screen`
3. If score ≥ `OFAC_MIN_SCORE` → block + log for compliance review
4. If no match → proceed to email provider subscription

## Fail-open behavior
If SanctionsLookup is unreachable (network error, outage), the function logs the error
and **allows** the subscription through. This avoids blocking legitimate subscribers
due to a third-party outage. You can flip this to fail-closed by modifying
`proceedWithSubscription()` to return a 503 instead.

## Score threshold
- `85` — good balance: catches clear matches, minimizes false positives on common names
- `90+` — tighter, fewer false positives, may miss slight name variations
- `80`  — SanctionsLookup default; broader net

## Next step: Option 1 (self-hosted)
When ready to remove the third-party dependency, replace the SanctionsLookup call
with a Cloudflare Worker that downloads the OFAC SDN CSV directly from Treasury,
caches it in Cloudflare KV, and does fuzzy matching in-process.
