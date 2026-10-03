# Deploying soulcraft.me

This is a static site (`index.html`, `styles.css`, `main.js`, `assets/`) plus one
serverless function for the email form (`soulcraft-newsletter-lambda.js`). Adapted
from wellmate-site/DEPLOY.md. Hosting plan:

| Piece            | Service                     | What it does                          |
|------------------|-----------------------------|---------------------------------------|
| The website      | AWS Amplify Hosting         | Serves the static files, HTTPS, domain    |
| Newsletter form  | AWS Lambda + Function URL    | Subscribes emails to Sender.net       |
| Email list       | Sender.net                  | Stores subscribers, sends campaigns   |

Suggested region: **ap-southeast-2 (Sydney)**, closest to the audience. Use the
same region for Lambda.

---

## Part A, Host the site on Amplify

1. AWS Console → **Amplify** → **Create new app** → **Host web app**.
2. Source: **GitHub** → authorize AWS (one-time OAuth) → repo
   **`edwellmate/soulcraft-site`**, branch **`main`**.
3. Build settings: Amplify detects the committed **`amplify.yml`** (no build step,
   deploys `index.html`, `styles.css`, `main.js`, `assets/`). Accept it.
4. **Save and deploy**. First build takes ~1–2 min. Site goes live at
   `https://main.<app-id>.amplifyapp.com`.
5. Every future `git push` to `main` auto-deploys.

---

## Part B, Newsletter Lambda

> Do this once. The Sender token lives ONLY here, never in the website.

1. Reuse the Sender token already in the `btp-newsletter` Lambda (same Sender
   account), or generate a new one under Sender → Settings → API access tokens.
2. Lambda Console (same region) → **Create function** → **Author from scratch**
   - Name: `soulcraft-newsletter`
   - Runtime: **Node.js 20.x or newer** (22.x / 24.x are fine, `fetch` is built in)
   - Create function.
3. **Code** tab → replace `index.mjs`/`index.js` contents with the contents of
   `soulcraft-newsletter-lambda.js` from this repo. Confirm the handler is
   **`index.handler`** → **Deploy**.
   - (If the editor created `index.mjs`, rename to `index.js`, or set the handler
     to match the file. The code uses `exports.handler` = CommonJS, so `index.js`.)
4. **Configuration → Environment variables** → Edit → add:
   - `SENDER_TOKEN` = your **new** Sender API token  *(required)*
   - `SENDER_GROUP_ID` = `b8zpn3`, the existing Behind The Practice group.
     **Decided 2026-10-03: one list for everything** (podcast, Soulcraft, Path
     Collective, one newsletter with three sections, same audience). The `source`
     field in the SNS note records where each person signed up.
   - `NOTIFY_TOPIC_ARN` = the SNS topic already used by `btp-newsletter` *(optional)*
5. **Configuration → Function URL** → **Create function URL**
   - Auth type: **NONE**
   - Configure **CORS**:
     - Allow origin: `https://www.soulcraft.me`
     - Allow methods: `POST`
     - Allow headers: `content-type`
   - Save. Copy the URL, e.g. `https://abcd1234.lambda-url.ap-southeast-2.on.aws/`

---

## Part C, Connect the form to the Lambda

1. Edit `main.js`, top of file:
   ```js
   var FORM_ENDPOINT = ""; // e.g. "https://xxxx.lambda-url.ap-southeast-2.on.aws/"
   ```
   Paste your Function URL between the quotes.
2. `git add main.js && git commit -m "Wire form to Lambda" && git push`
3. Amplify redeploys automatically. Test the form on the live site, a real email
   should appear in Sender within a few seconds.

---

## Part D, Custom domain (soulcraft.me), DNS is at **Hostinger**

`soulcraft.me` uses Hostinger nameservers (`ns1/ns2.dns-parking.com`), so DNS is
edited in Hostinger's **DNS Zone**, NOT Route 53. The apex currently shows Hostinger's "parked domain" page (A record → `2.57.91.91`).

> ⚠ **Do not touch** the `consulting`, `path` and `reels` subdomain records, they point
> at the Lightsail box (`13.236.56.196`) and run the consulting app, the issues board
> and reels. Only `@` (apex) and `www` change here.

### D1. In Amplify
1. App → **Hosting → Custom domains → Add domain** → `soulcraft.me`.
2. Map `soulcraft.me` (root) and `www` → branch `main`. Save.
3. Amplify shows a list of **DNS records to add**. There are two kinds:
   - **SSL validation**, a CNAME like `_abc123.soulcraft.me → _def456.xxxx.acm-validations.aws`
   - **Routing**, a CNAME for `www` → an `…cloudfront.net` (or `…amplifyapp.com`) target
   Leave this Amplify screen open; the exact values are unique to your app.

### D2. In Hostinger (hPanel)
1. **hPanel → Domains → `soulcraft.me` → DNS / Nameservers → DNS Zone**
   (a.k.a. "DNS Zone Editor").
2. Add the **SSL validation CNAME**:
   - Type: `CNAME`
   - Name/Host: the prefix Amplify shows **without** the trailing `.soulcraft.me`
     (e.g. paste `_abc123`)
   - Target/Points to: the `…acm-validations.aws` value (include trailing dot if shown)
   - TTL: default
3. Add the **www routing CNAME**:
   - Type: `CNAME`, Name: `www`, Target: the `…cloudfront.net` value from Amplify.
   - If an existing `www` record is present, edit/replace it.
4. **Apex / root `soulcraft.me`**, Hostinger DNS can't put a CNAME on the root, so:
   - hPanel → **Domains → `soulcraft.me` → Redirects** → redirect `soulcraft.me`
     → `https://www.soulcraft.me` (301). This makes `www` canonical and bounces the
     bare domain to it.
   - (If Amplify offers an apex record Hostinger accepts, you can add that instead -
     but the redirect approach is the reliable one on Hostinger.)
5. Remove the parking `A` record for `@` (`2.57.91.91`) once the redirect is in place.

### D3. Wait + finish
- Back in Amplify, the domain moves through **Pending verification → Available**.
  SSL issuance takes **15 min–several hours** after the records resolve.
- Once live, update the Lambda to the real origin(s):
  - **Function URL → Edit → CORS → Allow origins**: add BOTH
    `https://www.soulcraft.me` and `https://soulcraft.me` (the URL CORS accepts a list).
- `FORM_ENDPOINT` is the Lambda URL, which doesn't change.

> Tip: read the exact records Amplify generates out loud / paste them, and they can
> be mapped 1:1 to the Hostinger fields above.

---

## Notes

- **No dependencies to bundle.** The Lambda uses the global `fetch` built into the
  Node.js 20 runtime, a plain paste-in function works.
- **Cost:** at this traffic level both Amplify and Lambda sit comfortably in the
  free tier / a few cents a month.
- **Fallback:** if `FORM_ENDPOINT` is empty, the signup button gracefully opens a
  pre-filled email instead of failing, the page is never broken mid-setup.
- **Token hygiene:** never commit `SENDER_TOKEN` or paste it into `index.html`.
  It belongs only in the Lambda environment variables.

---

## Part E, Booking links (Stripe + TidyCal)

1. **Stripe → Payment Links → New**: product "Quick-Win Session (60 min)", A$149, one-off.
   After payment → **Redirect to a URL** → your TidyCal booking page.
2. **TidyCal → Booking types → New**: "Quick-Win Session", 60 min, online (Zoom/Meet).
   Copy the public booking URL.
3. Edit `main.js`: `STRIPE_LINK = "<payment link>"`, `TIDYCAL_URL = "<tidycal url>"`.
   Commit + push; Amplify redeploys.
4. Test end to end once with a 100%-off coupon or Stripe test mode.

## Part F, Retiring wellmate.me (when ready)

1. hPanel → Domains → `wellmate.me` → Redirects: `wellmate.me` and `www.wellmate.me`
   → `https://www.soulcraft.me/#podcast` (301). Remove the `www` CNAME to Amplify.
2. Update podcast show notes, Instagram bio and any Linktree to soulcraft.me.
3. Create `eduardo@soulcraft.me` (Hostinger email or Microsoft 365, same as wellmate)
   and replace `eduardo@wellmate.me` in `docs/CONTENT.md` + `index.html`.
4. Delete the wellmate Amplify app. Keep the `btp-newsletter` Lambda until the
   Soulcraft one is live, then delete it too (the SNS topic can stay).
5. Keep the `wellmate.me` registration for at least one more cycle so old links resolve.
