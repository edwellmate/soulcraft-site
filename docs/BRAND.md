# Soulcraft brand — v1 ("Earth & clay")

Soulcraft must read as its own thing next to its siblings:
- **Wellmate / Behind The Practice**: teal `#006D77`, salmon `#E9967A`, sage, cream; Fraunces + Inter; pill buttons; animated rings.
- **Path Collective**: canvas `#F7F0E6`, yellow `#F0B853`, teal `#75A096`, terra `#DE866D`; Sora + Nunito Sans + M PLUS Rounded.

So Soulcraft is **warmer and darker**: fired clay, ochre, moss and linen; a soft serif with real ink in it; square-ish corners; grain instead of gloss. Hand-made, grounded, supportive. If a screen could pass for a SaaS landing page, it is wrong.

## 1. Colour tokens

Define exactly these in `:root`; use nothing else (tints via `color-mix()` are fine).

```css
:root{
  --clay:      #B5542E;  /* primary: CTAs, links, eyebrow rule */
  --clay-deep: #8E3F22;  /* hover / pressed */
  --ochre:     #D9A441;  /* accent: highlights, step numbers, badge */
  --moss:      #3F4A3A;  /* dark sections (stance, podcast) */
  --moss-deep: #2F372C;  /* dark section gradients / footer hover */
  --linen:     #F4EDE3;  /* page background */
  --sand:      #E8DCCB;  /* alternate section bg, cards on linen */
  --white:     #FFFCF8;  /* card surface on sand */
  --bark:      #2B2420;  /* ink: headings, body on light */
  --stone:     #6B625A;  /* muted text, captions */
  --hair:      rgba(43,36,32,.12); /* hairlines */
  --on-dark:   #F4EDE3;  /* text on moss/bark */
  --on-dark-muted: rgba(244,237,227,.72);
}
```

Section rhythm (top to bottom): linen → moss → sand → linen → white → sand → moss → linen → white → sand → bark (footer). Never two dark sections adjacent.

Contrast pairs that must pass AA (verify with `tools/contrast.mjs`): bark/linen, bark/sand, bark/white, stone/linen (≥ 4.5), clay/linen (≥ 4.5 for body-size links; if it fails, darken links to `--clay-deep`), on-dark/moss, ochre/moss (headings only, ≥ 3), linen/clay (button text), white/clay-deep.

Dark mode: not required for v1. Set `color-scheme: light` so the form controls don't invert.

## 2. Typography

- Display: **Newsreader** (Google Fonts, opsz axis; weights 400 + 500, italic 400). Headlines, pull quotes, the price.
- Body/UI: **Work Sans** (400, 500, 600). Everything else, including nav and buttons.
- Load one `<link>` with `display=swap`; declare `--display: "Newsreader", Georgia, serif; --body: "Work Sans", system-ui, sans-serif;`.
- Scale (fluid with `clamp()`): h1 `clamp(2.2rem, 5.5vw, 3.6rem)` line-height 1.08, letter-spacing −0.01em · h2 `clamp(1.7rem, 3.6vw, 2.5rem)` · h3 1.25rem Work Sans 600 · body 1.0625rem / 1.6 · small 0.875rem.
- `.eyebrow`: Work Sans 600, 0.75rem, uppercase, letter-spacing 0.12em, colour clay, with a 22 px clay rule before it (same device as wellmate's, different colour — it's a family trait).
- Italic Newsreader for one emphasised phrase per section at most.

## 3. Shape, surface, motion

- Radii: **12 px** on cards and buttons, 8 px on inputs, 999 px only for the "Launching soon" badge. No pill buttons.
- Buttons: solid clay with linen text; hover clay-deep + `translateY(-1px)`; focus ring 3 px ochre at 2 px offset. Secondary: 1.5 px bark outline, transparent fill.
- Cards: `--white` on sand or `--sand` on linen, 1 px `--hair` border, no drop shadow heavier than `0 1px 0 var(--hair)`.
- Grain: a 4%-opacity SVG `feTurbulence` noise overlay on linen and sand sections (one reusable `.grain::after`), disabled under `prefers-reduced-motion`? — no, grain is static; keep it. Keep it off dark sections.
- Motion: the hero mark may breathe (scale 1 → 1.03, 9 s, ease-in-out, infinite) — under `prefers-reduced-motion: reduce` it is static. Nothing else animates except hover transitions ≤ 200 ms.

## 4. Icons

- One set, outline, 1.75 px stroke, round caps and joins, 24 px grid, colour `currentColor`. Base on Lucide (MIT) and hand-adjust so they feel drawn, not engineered. Inline `<svg aria-hidden="true">` with a visible text label next to it — never icon-only controls.
- Service card icons (one each): sprout (AI assistants), layers/stack (right-size), hand-heart or shield (Tech Care), book-open (AI learning). Step numbers in How-it-works are Newsreader numerals in ochre, not icons.
- Social: Spotify, Apple Podcasts, YouTube, Instagram — port the paths from wellmate.me, recolour via `currentColor`.

## 5. Logo brief (the agent produces v1; Ed refines later)

- **Mark**: a seed or sprout — two leaves rising from a dot — inside a soft, slightly irregular circle (hand-drawn wobble, not geometric). Single colour: clay on linen, or linen on moss. Must read at 24 px (favicon) and 160 px.
- **Wordmark**: `soulcraft` lowercase, Newsreader 500, letter-spacing −0.02em, bark. Lockup: mark left, wordmark right, 0.5× mark width gap. Provide `logo.svg` (lockup), `mark.svg`, `favicon.svg` (mark only, clay on transparent), `apple-touch-icon.png` (mark on linen, 180 px).
- No taglines inside the logo. No gradients.

## 6. Imagery

- Only the portrait (`assets/portrait.jpg`) and the Path Collective logo. No stock photos, no illustrations of robots/circuits/laptops. If a section wants a visual, use the mark, a grain field, or whitespace.
- Portrait treatment: 12 px radius, 1 px hair border, optional ochre offset frame (4 px, translated 8 px/8 px) behind it.

## 7. Voice (for layout decisions, copy is fixed in CONTENT.md)

Short lines. One idea per card. Numbers are plain (`$149`, `60 min`). Headings are sentences, not titles. The page should feel like a calm person explaining what they do, not a brochure.
