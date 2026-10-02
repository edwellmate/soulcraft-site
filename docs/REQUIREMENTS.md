# soulcraft.me — Software Requirements (v1)

Owner: Eduardo Rivas (Ed) · Entity: MBS Unity Pty Ltd · Written 2026-10-02.
Companions: [BRAND.md](BRAND.md) (tokens, type, icons, logo) · [CONTENT.md](CONTENT.md) (every word on the page) · [DEPLOY.md](DEPLOY.md) (Amplify, Lambda, DNS).

## 1. Purpose

Soulcraft is Ed's technology and AI consultancy for holistic-wellness facilitators, community builders, and small solo businesses that run on a spreadsheet and goodwill. The site has one job: someone who already knows Ed (from the Behind The Practice podcast, Path Collective, a dance floor) lands here, understands in 30 seconds that he is "the tech person who gets this world", and books a **$149 Quick-Win Session** without a second thought.

It is **not** a lead-gen funnel for strangers and it does **not** sell the deep assessment (that stays internal). It also becomes the single home for everything Ed does online: wellmate.me will be retired and redirected here (see §9), so the podcast and Path Collective must live on this page as real sections, not links.

Tone: grounded, warm, earthy, wholesome, supportive. Short-term genuinely useful, long-term a partner. Never tech-bro, never "AI-powered synergy".

## 2. Stack & constraints

- **Static site, no framework, no build step.** Files: `index.html`, `styles.css`, `main.js`, `assets/`. Hosted on AWS Amplify from `main` (see `amplify.yml`). Node is allowed only for dev tooling (Lighthouse, Playwright screenshots, contrast check) — never as a runtime dependency.
- **No base64-inlined photos** (wellmate.me's single file was 1.18 MB because of one portrait). Images are real files under `assets/`; logo and icons are inline or external **SVG**. `assets/portrait.jpg` (750×900) is provided; serve it at ≤ 600 px wide with `width`/`height` attributes and `loading="lazy"`.
- External resources allowed: Google Fonts (one `<link>`), the three podcast embeds (Spotify, Apple Podcasts, YouTube-nocookie), Stripe Payment Link and TidyCal as plain links. Nothing else — no analytics tonight.
- Australian English (`lang="en-AU"`). Prices in AUD, written `$149` (no "AUD" on the page; JSON-LD carries the currency).
- Accessibility: WCAG 2.1 AA. Semantic landmarks, one `<h1>`, visible focus rings, `aria-live` on form status, `prefers-reduced-motion` guard for any animation, all images with meaningful `alt`.
- Performance budget: HTML+CSS+JS ≤ 60 KB gzipped (excluding embeds and the portrait). Embeds use `loading="lazy"`. Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO (mobile preset).
- Responsive: mobile-first, 16 px side gutters, no horizontal scroll at 360 px, breakpoints roughly 620 / 860 / 1080 px. `--maxw: 1120px`.

## 3. Page structure (single page, anchors)

All copy comes from [CONTENT.md](CONTENT.md) verbatim. The agent decides layout and visual detail inside the rules of [BRAND.md](BRAND.md).

| # | Section | id | Background | Notes |
|---|---|---|---|---|
| 0 | Nav (sticky) | — | bone, hairline | Logo left; links: Services · Work · Podcast · About; CTA button "Book a Quick-Win Session" → `#quick-win`. Mobile: hamburger toggling a class, no JS framework. |
| 1 | Hero | `#top` | bone | H1 + sub + primary CTA (→ `#quick-win`) + secondary text link (→ `#how`). Soft concentric arcs decoration (BRAND.md §6) right side, hidden < 860 px. |
| 2 | The stance | `#why` | night (dark) | 3 short columns: Start small · Build on what you own · Stay around. |
| 3 | Quick-Win Session | `#quick-win` | sand | The one card with a price. Price, duration, "what you leave with" list, the credit line, the booking flow (§5), and the "not sure yet?" line. |
| 4 | Services | `#services` | bone | 4 cards: AI assistants & automations · Right-size your tech stack · Tech Care · AI learning (coming soon — this card has an inline email capture, see §6). |
| 5 | Work | `#work` | white | 2 anonymised stories, each: Situation → What we did first → What's next. No client names, no logos, no exact prices. |
| 6 | How it works | `#how` | pebble | 3 numbered steps. |
| 7 | Podcast | `#podcast` | night (dark) | Behind The Practice: eyebrow, paragraph, the three embeds (copied from `docs/_wellmate-episodes-section.html` — keep the iframe attributes exactly), "Be a guest" line with email + Instagram DM. |
| 8 | About | `#about` | bone | Portrait + the three hats (Soulcraft founder · podcast host · Path Collective co-founder & CPO) each with its link; Instagram handle with icon. |
| 9 | Path Collective | `#path` | white | Logo (`assets/path-collective-logo.png`), "Launching soon in Australia" badge, 2 sentences, link. |
| 10 | Stay in touch | `#join` | sand | Email form (§6). |
| 11 | Footer | — | night-deep | 4 columns: Soulcraft (services/work/book) · Podcast (listen links) · Elsewhere (Wellmate, Path Collective, Instagram) · Contact. Legal line: `© 2026 MBS Unity Pty Ltd · soulcraft.me`. |

## 4. Head / SEO

- `<title>Soulcraft · Technology that supports the work you actually do</title>`
- Meta description, OG (`og:type website`, `og:site_name soulcraft.me`, `og:url https://www.soulcraft.me/`, `og:image /assets/og.png` 1200×630 generated in the palette), Twitter `summary_large_image`.
- `<link rel="canonical" href="https://www.soulcraft.me/">`
- Favicon: `assets/favicon.svg` + `assets/apple-touch-icon.png` (180 px) from the favicon tile (BRAND.md §5).
- JSON-LD: one `ProfessionalService` (name Soulcraft, founder Person Eduardo Rivas, areaServed AU, url, sameAs: Instagram, wellmate.me, pathcollective.com) with an `Offer` for the Quick-Win Session (`price 149`, `priceCurrency AUD`). Plus the `PodcastSeries` block ported from wellmate.me's head (lines 20–57 of its `index.html`) with `url` updated to `https://www.soulcraft.me/#podcast`.

## 5. Booking flow (Quick-Win Session)

`main.js` starts with three constants, empty by default; Ed fills them the morning after:

```js
var STRIPE_LINK   = "";   // Stripe Payment Link, $149 AUD, success URL = TIDYCAL_URL
var TIDYCAL_URL   = "";   // TidyCal booking page for the 60-min session
var FORM_ENDPOINT = "";   // Lambda Function URL for the email form
```

Behaviour of the primary CTA ("Book a Quick-Win Session"):
1. `STRIPE_LINK` set → navigate to it (new tab not required; same tab is fine). Stripe's success URL sends them on to TidyCal. The card explains this in one line ("pay, then pick a time").
2. `STRIPE_LINK` empty but `TIDYCAL_URL` set → navigate to TidyCal (pay on the day).
3. Both empty → open `mailto:eduardo@wellmate.me?subject=Quick-Win%20Session` with a short prefilled body.

The secondary link "Not sure yet? Say hi" always goes to the mailto / Instagram DM.

## 6. Email form (Stay in touch + AI-learning card)

Same contract as wellmate.me (`docs/_wellmate-DEPLOY.md`, `soulcraft-newsletter-lambda.js`):
- `<form id="sc-signup">` with one `type="email" name="email" required` input and a button; status `<p id="sc-signup-msg" aria-live="polite">`.
- Client validates with a simple regex, then `fetch(FORM_ENDPOINT, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email, source})})`. `source` is `"join"` or `"ai-learning"` so the SNS note says where they signed up. (The Lambda ignores unknown fields today — adding `source` to the SNS message is a one-line change, included in `soulcraft-newsletter-lambda.js`.)
- Responses: `{ok:true}` → "You're in. Talk soon." · `{ok:true, already:true}` → "You're already on the list." · anything else → friendly error with the mailto fallback.
- `FORM_ENDPOINT` empty → open a prefilled mailto instead of failing.
- **No CORS headers in the Lambda** — the Function URL config owns CORS (duplicate headers break browsers; learned on wellmate.me).
- The AI-learning card reuses the same JS with a second small form (`id="sc-signup-ai"`, `source:"ai-learning"`).

## 7. Assets the agent must produce

- `assets/logo.svg` + `assets/logo-on-dark.svg` — outlined wordmark (BRAND.md §5). Also `assets/favicon.svg`, `assets/apple-touch-icon.png`.
- `assets/og.png` 1200×630 — mark + wordmark + tagline on linen (render the SVG with a headless browser or `sharp`/`resvg` via `npx`; commit the PNG).
- Icons: inline SVG, one consistent set (BRAND.md §4). Social icons for Spotify, Apple Podcasts, YouTube, Instagram may be ported from wellmate.me's hero (`docs/_wellmate-episodes-section.html` and the wellmate repo `index.html:361–364`).
- `assets/path-collective-logo.png` and `assets/portrait.jpg` are provided.
- Delete `assets/wellmate-logo.png` and `assets/wellmate-favicon.png` once the Soulcraft logo exists (they are reference only).

## 8. Quality gates (each is a checkbox in the report)

1. `npx html-validate index.html` (or W3C validator) — no errors.
2. Contrast: a small script (`tools/contrast.mjs`) computes WCAG ratios for every text/background token pair used; all ≥ 4.5:1 (≥ 3:1 for ≥ 24 px headings). Results pasted in the report.
3. `npx lighthouse http://localhost:8080 --preset=desktop` and mobile (default) with `npx serve` or `python3 -m http.server 8080` — scores ≥ 95 ×4; JSON reports not committed.
4. Playwright screenshots at 360, 768, 1280 px (`tools/screenshots.mjs`) attached to the report issue; `screenshots/` gitignored.
5. No console errors; every anchor in the nav and footer resolves; every external link has `rel="noopener"` and `target="_blank"` only where it leaves the site.
6. Copy diff: every sentence on the page appears in CONTENT.md (a quick grep spot-check is enough; call out any deviation).

## 9. Wellmate.me retirement (context, not tonight's work)

Ed will retire wellmate.me (sooner rather than later). Tonight's build makes soulcraft.me able to absorb it: the `#podcast` section carries the same embeds, the `#path` section the same cross-promo, and the email form feeds the same Sender.net list. Later, Ed sets a Hostinger 301 `wellmate.me/* → https://www.soulcraft.me/#podcast`, updates show notes / Instagram bio / Linktree, and deletes the wellmate Amplify app. Nothing on this site may hard-depend on wellmate.me being up except the contact email, which is replaced once `eduardo@soulcraft.me` exists (checklist).

## 10. Out of scope tonight (Ed's morning checklist — `night-shift:skip` issues)

Stripe Payment Link · TidyCal booking page · Sender.net group decision · Lambda deploy + Function URL CORS · Amplify app + custom domain · Hostinger DNS for apex and `www` (the `consulting.`, `path.`, `reels.` subdomains point at the Lightsail box and must not be touched) · `eduardo@soulcraft.me` mailbox · a Soulcraft line in wellmate.me's host section.
