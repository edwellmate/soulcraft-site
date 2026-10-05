# soulcraft.me, Software Requirements (v1)

Owner: Eduardo Rivas (Ed) · Entity: Eduardo Rivas, sole trader (Soulcraft); Stripe + invoices under his ABN, not MBS Unity · Written 2026-10-02.
Companions: [BRAND.md](BRAND.md) (tokens, type, icons, logo) · [CONTENT.md](CONTENT.md) (every word on the page) · [DEPLOY.md](DEPLOY.md) (Amplify, Lambda, DNS).

## 1. Purpose

Soulcraft is Ed's technology and AI consultancy for holistic-wellness facilitators, community builders, and small solo businesses that run on a spreadsheet and goodwill. The site has one job: someone who already knows Ed (from the Behind The Practice podcast, Path Collective, a dance floor) lands here, understands in 30 seconds that he is "the tech person who gets this world", and books a **$149 Quick-Win Session** without a second thought.

It is **not** a lead-gen funnel for strangers and it does **not** sell the deep assessment (that stays internal). It also becomes the single home for everything Ed does online: wellmate.me will be retired and redirected here (see §9), so the podcast and Path Collective must live on this page as real sections, not links.

Tone: grounded, warm, earthy, wholesome, supportive. Short-term genuinely useful, long-term a partner. Never tech-bro, never "AI-powered synergy".

## 2. Stack & constraints

- **Static site, no framework, no build step.** Files: `index.html`, `styles.css`, `main.js`, `assets/`. Hosted on AWS Amplify from `main` (see `amplify.yml`). Node is allowed only for dev tooling (Lighthouse, Playwright screenshots, contrast check), never as a runtime dependency.
- **No base64-inlined photos** (wellmate.me's single file was 1.18 MB because of one portrait). Images are real files under `assets/`; logo and icons are inline or external **SVG**. `assets/portrait.jpg` (750×900) is provided; serve it at ≤ 600 px wide with `width`/`height` attributes and `loading="lazy"`.
- External resources allowed: Google Fonts (one `<link>`), the three podcast embeds (Spotify, Apple Podcasts, YouTube-nocookie), Stripe Payment Link and Microsoft Bookings as plain links. Nothing else, no analytics tonight.
- Australian English (`lang="en-AU"`). Prices in AUD, written `$149` (no "AUD" on the page; JSON-LD carries the currency).
- Accessibility: WCAG 2.1 AA. Semantic landmarks, one `<h1>`, visible focus rings, `aria-live` on form status, `prefers-reduced-motion` guard for any animation, all images with meaningful `alt`.
- Performance budget: HTML+CSS+JS ≤ 60 KB gzipped (excluding embeds and the portrait). Embeds use `loading="lazy"`. Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO (mobile preset).
- Responsive: mobile-first, 16 px side gutters, no horizontal scroll at 360 px, breakpoints roughly 620 / 860 / 1080 px. `--maxw: 1120px`.

## 3. Page structure (single page, anchors)

All copy comes from [CONTENT.md](CONTENT.md) verbatim. The agent decides layout and visual detail inside the rules of [BRAND.md](BRAND.md).

| # | Section | id | Background | Notes |
|---|---|---|---|---|
| 0 | Nav (sticky) |, | bone, hairline | Logo; links About · Consulting · Podcast · Path Collective; CTA "Book a Quick-Win Session" → `#quick-win`. |
| 1 | Hero | `#top` | bone | H1 + sub + two pills side by side: primary (euc) "Start with a Quick-Win Session ↓" → `#quick-win`, secondary (rose, ink text) "Listen to Behind The Practice ↓" → `#podcast`. Arcs decoration ≥ 860 px. |
| 1b | About | `#about` | pebble | Portrait + three hats + Instagram. **Second section, right after the hero (Ed, 2026-10-05):** its three hats link to `#services`, `#podcast` and `#path`, so placed here they read as a map of the page. Lower down the same links point backwards at sections already passed. |
| 2 | What I help with | `#services` | night | 3 service cards (white on night). The AI-learning card was removed in v1.2 (2026-10-05), see CONTENT.md. |
| 3 | Start with a Quick-Win Session | `#quick-win` | sand | The priced card (hours Tue to Thu, 10am to 4pm, reach-out line) + "What happens next" three-step row beneath it. |
| 4 | Behind The Practice | `#podcast` | bone | Intro ("This is their microphone."), pull quote, three embeds unchanged, "Come on the show" block with four bullets + reach-out. |
| 5 | Path Collective | `#path` | white | Logo, badge, two sentences, link. |
| 7 | Stay close to the work | `#join` | sand | Email form + "Unsubscribe anytime." |
|, | Footer |, | night-deep | Soulcraft (Services · Book) · Podcast · Elsewhere (Path Collective · Instagram) · Contact. Legal: © 2026 Eduardo Rivas · soulcraft.me |

v1.1 (2026-10-03) removed The stance, Work (two stories) and How it works as standalone sections; rationale in the plan: three sections repeated "start small", price appeared before services, counting titles.

## 4. Head / SEO

- `<title>Soulcraft · Technology that supports the work you actually do</title>`
- Meta description, OG (`og:type website`, `og:site_name soulcraft.me`, `og:url https://www.soulcraft.me/`, `og:image /assets/og.png` 1200×630 generated in the palette), Twitter `summary_large_image`.
- `<link rel="canonical" href="https://www.soulcraft.me/">`
- Favicon: `assets/favicon.svg` + `assets/apple-touch-icon.png` (180 px) from the favicon tile (BRAND.md §5).
- JSON-LD: one `ProfessionalService` (name Soulcraft, founder Person Eduardo Rivas, areaServed AU, url, sameAs: Instagram, wellmate.me, pathcollective.com) with an `Offer` for the Quick-Win Session (`price 149`, `priceCurrency AUD`). Plus the `PodcastSeries` block ported from wellmate.me's head (lines 20–57 of its `index.html`) with `url` updated to `https://www.soulcraft.me/#podcast`.

## 5. Booking flow (Quick-Win Session)

`main.js` starts with three constants, empty by default; Ed fills them the morning after:

```js
var STRIPE_LINK   = "";   // Stripe Payment Link, $149 AUD, success URL = BOOKING_URL
var BOOKING_URL   = "";   // Microsoft Bookings public page for the 60-min session
var FORM_ENDPOINT = "";   // Lambda Function URL for the email form
```

Behaviour of the primary CTA ("Book a Quick-Win Session"):
1. `STRIPE_LINK` set → navigate to it (new tab not required; same tab is fine). Stripe's success URL sends them on to Microsoft Bookings. The card explains this in one line ("pay, then pick a time").
2. `STRIPE_LINK` empty but `BOOKING_URL` set → navigate to Microsoft Bookings (pay on the day).
3. Both empty → open `mailto:eduardo@soulcraft.me?subject=Quick-Win%20Session` with a short prefilled body.

The secondary link "Not sure yet? Say hi" always goes to the mailto / Instagram DM.

## 6. Email form (Stay in touch)

Same contract as wellmate.me (`docs/_wellmate-DEPLOY.md`, `soulcraft-newsletter-lambda.js`):
- `<form id="sc-signup">` with one `type="email" name="email" required` input and a button; status `<p id="sc-signup-msg" aria-live="polite">`.
- Client validates with a simple regex, then `fetch(FORM_ENDPOINT, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email, source})})`. `source` is `"join"` or `"ai-learning"` so the SNS note says where they signed up. (The Lambda ignores unknown fields today, adding `source` to the SNS message is a one-line change, included in `soulcraft-newsletter-lambda.js`.)
- Responses: `{ok:true}` → "You're in. Talk soon." · `{ok:true, already:true}` → "You're already on the list." · anything else → friendly error with the mailto fallback.
- `FORM_ENDPOINT` empty → open a prefilled mailto instead of failing.
- **No CORS headers in the Lambda**, the Function URL config owns CORS (duplicate headers break browsers; learned on wellmate.me).
- One form only since v1.2 (`id="sc-signup"`, `source:"join"`). On success the browser goes to `welcome.html`; Sender sends the welcome email. The Lambda still accepts `source:"ai-learning"` for a future relaunch.

## 7. Assets the agent must produce

- `assets/logo.svg` + `assets/logo-on-dark.svg`, outlined wordmark (BRAND.md §5). Also `assets/favicon.svg`, `assets/apple-touch-icon.png`.
- `assets/og.png` 1200×630, mark + wordmark + tagline on linen (render the SVG with a headless browser or `sharp`/`resvg` via `npx`; commit the PNG).
- Icons: inline SVG, one consistent set (BRAND.md §4). Social icons for Spotify, Apple Podcasts, YouTube, Instagram may be ported from wellmate.me's hero (`docs/_wellmate-episodes-section.html` and the wellmate repo `index.html:361–364`).
- `assets/path-collective-logo.png` and `assets/portrait.jpg` are provided.
- Delete `assets/wellmate-logo.png` and `assets/wellmate-favicon.png` once the Soulcraft logo exists (they are reference only).

## 8. Quality gates (each is a checkbox in the report)

1. `npx html-validate index.html` (or W3C validator), no errors.
2. Contrast: a small script (`tools/contrast.mjs`) computes WCAG ratios for every text/background token pair used; all ≥ 4.5:1 (≥ 3:1 for ≥ 24 px headings). Results pasted in the report.
3. `npx lighthouse http://localhost:8080 --preset=desktop` and mobile (default) with `npx serve` or `python3 -m http.server 8080`, scores ≥ 95 ×4; JSON reports not committed.
4. Playwright screenshots at 360, 768, 1280 px (`tools/screenshots.mjs`) attached to the report issue; `screenshots/` gitignored.
5. No console errors; every anchor in the nav and footer resolves; every external link has `rel="noopener"` and `target="_blank"` only where it leaves the site.
6. Copy diff: every sentence on the page appears in CONTENT.md (a quick grep spot-check is enough; call out any deviation).

## 9. Wellmate.me retirement (context, not tonight's work)

Ed will retire wellmate.me (sooner rather than later). Tonight's build makes soulcraft.me able to absorb it: the `#podcast` section carries the same embeds, the `#path` section the same cross-promo, and the email form feeds the same Sender.net list. Later, Ed sets a Hostinger 301 `wellmate.me/* → https://www.soulcraft.me/#podcast`, updates show notes / Instagram bio / Linktree, and deletes the wellmate Amplify app. Nothing on this site may hard-depend on wellmate.me being up except the contact email, which is replaced once `eduardo@soulcraft.me` exists (checklist).

## 10. Out of scope tonight (Ed's morning checklist, `night-shift:skip` issues)

Stripe Payment Link · Microsoft Bookings page · Sender.net group decision · Lambda deploy + Function URL CORS · Amplify app + custom domain · Hostinger DNS for apex and `www` (the `consulting.`, `path.`, `reels.` subdomains point at the Lightsail box and must not be touched) · `eduardo@soulcraft.me` mailbox · a Soulcraft line in wellmate.me's host section.
