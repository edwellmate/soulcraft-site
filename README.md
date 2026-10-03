# soulcraft-site

Public website for **Soulcraft**, Eduardo Rivas's technology & AI practice for wellness facilitators, community builders and small practices. Static HTML on AWS Amplify at [soulcraft.me](https://www.soulcraft.me).

- `index.html` · `styles.css` · `main.js` · `assets/`, the whole site; no framework, no build step
- `docs/REQUIREMENTS.md` · `docs/BRAND.md` · `docs/CONTENT.md`, the spec the site is built from
- `docs/DEPLOY.md`, Amplify, Lambda, Stripe/TidyCal, Hostinger DNS, and the wellmate.me retirement steps
- `soulcraft-newsletter-lambda.js`, email form backend (Sender.net)
- `tools/contrast.mjs` · `tools/screenshots.mjs`, the quality checks (see below)

Built overnight by a Claude Code routine from the issue queue; see `.claude/skills/night-shift/SKILL.md`.

## Fill these in

Three public URLs live at the top of `main.js` and ship empty. Until they are filled, every "Book" button and both email forms fall back to a prefilled `mailto:eduardo@soulcraft.me`.

```js
var STRIPE_LINK   = "";   // Stripe Payment Link, $149 AUD, success URL = TIDYCAL_URL
var TIDYCAL_URL   = "";   // TidyCal booking page for the 60-min session
var FORM_ENDPOINT = "";   // Lambda Function URL for the email form
```

| Constant | Where it comes from | Behaviour once set |
|---|---|---|
| `STRIPE_LINK` | `docs/DEPLOY.md` Part E, step 1 | "Book a Quick-Win Session" goes to Stripe; Stripe's success URL sends them on to TidyCal |
| `TIDYCAL_URL` | `docs/DEPLOY.md` Part E, steps 2–3 | Used as the Stripe success URL; if `STRIPE_LINK` is still empty, booking goes straight here (pay on the day) |
| `FORM_ENDPOINT` | `docs/DEPLOY.md` Parts B–C (Lambda + Function URL with CORS on the Function URL, none in code) | Both forms `POST` `{ "email", "source" }` as JSON; `source` is `join` or `ai-learning` |

Paste the value between the quotes, commit, push, Amplify redeploys `main` automatically (Part A). Domain and DNS are Part D.

## Checks before any merge

```sh
python3 -m http.server 8080          # in one terminal
npx html-validate index.html         # 0 errors
node tools/contrast.mjs              # every token pair ≥ AA
npx lighthouse http://localhost:8080 --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh.json
npx lighthouse http://localhost:8080 --preset=desktop --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-desktop.json
npx -p playwright node tools/screenshots.mjs   # screenshots/{360,768,1280}.png, gitignored
```

Lighthouse must be ≥ 95 on all four categories, mobile and desktop. Node is dev tooling only; nothing in `node_modules` is committed or served.
