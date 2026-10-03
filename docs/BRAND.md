# Soulcraft brand, v1 ("Eucalyptus & dusty rose")

Chosen by Ed 2026-10-03 from brand board III. Soulcraft is a **sibling of Wellmate**: same family (teal anchor, warm light ground, a rose accent) but cooler, dustier and a shade toward dusk, so the two sites feel related without being the same.
- **Wellmate / Behind The Practice**: teal `#006D77`, salmon `#E9967A`, sage `#D5ECDF`, cream `#F5F1ED`; Fraunces + Inter; pill buttons; animated rings.
- **Path Collective**: canvas `#F7F0E6`, yellow `#F0B853`, teal `#75A096`, terra `#DE866D`; Sora + Nunito Sans.

Soulcraft: eucalyptus green-teal, a deep night-blue for dark sections, dusty rose for warmth, pebble and bone for the light grounds. Calm, grounded, supportive, never brown, never tech-bro.

## 1. Colour tokens

Define exactly these in `:root`; use nothing else (tints via `color-mix()` are fine).

```css
:root{
  --euc:        #4E7D7A;  /* primary: CTAs, links, eyebrow rule */
  --euc-deep:   #3C6361;  /* hover / pressed */
  --night:      #343A56;  /* dark sections (stance, podcast) */
  --night-deep: #282D45;  /* footer, dark gradients */
  --rose:       #D4A09A;  /* accent: badge, highlights, eyebrow on dark */
  --rose-deep:  #B9807A;  /* rose text on light if contrast needs it */
  --pebble:     #DCD3C0;  /* alternate section bg, cards on bone */
  --sand:       #E9E1D2;  /* lighter alternate, form fields */
  --bone:       #F4EEE6;  /* page background */
  --white:      #FBF8F3;  /* card surface on pebble/sand */
  --ink:        #27312F;  /* headings, body on light */
  --stone:      #5E6866;  /* muted text, captions */
  --hair:       rgba(39,49,47,.12); /* hairlines */
  --on-dark:    #F4EEE6;  /* text on night/euc */
  --on-dark-muted: rgba(244,238,230,.72);
}
```

Section rhythm (top to bottom): bone → night → sand → bone → white → pebble → night → bone → white → sand → night-deep (footer). Never two dark sections adjacent.

Contrast pairs that must pass AA (verify with `tools/contrast.mjs`): ink/bone, ink/sand, ink/pebble, ink/white, stone/bone (≥ 4.5), euc/bone (body-size links, if it fails use `--euc-deep`), on-dark/night, on-dark/euc, rose/night (headings and eyebrows ≥ 3; body on night stays on-dark), bone/euc (button text), white/euc-deep. Rose is never body text on a light ground.

Dark mode: not required for v1. Set `color-scheme: light`.

## 2. Typography

- Display: **Literata** (Google Fonts, opsz axis; weights 400 + 500, italic 400 + 500). Headlines, pull quotes, the price, the wordmark.
- Body/UI: **Karla** (400, 500, 600). Everything else, including nav and buttons.
- One `<link>` with `display=swap`; declare `--display: "Literata", Georgia, serif; --body: "Karla", system-ui, sans-serif;`.
- Scale (fluid with `clamp()`): h1 `clamp(2.2rem, 5.5vw, 3.5rem)` line-height 1.1, weight 500 · h2 `clamp(1.7rem, 3.6vw, 2.4rem)` weight 500 · h3 1.2rem Karla 600 · body 1.0625rem / 1.6 · small 0.875rem.
- `.eyebrow`: Karla 600, 0.75rem, uppercase, letter-spacing 0.12em, colour euc on light / rose on dark, with a 22 px rule before it (same device as Wellmate's, it's a family trait).
- Italic Literata for one emphasised phrase per section at most (it echoes the wordmark).

## 3. Shape, surface, motion

- Buttons: **pill** (`border-radius: 999px`), solid euc with bone text; hover euc-deep + `translateY(-2px)`; focus ring 3 px rose at 2 px offset. Secondary: 1.5 px ink outline, transparent fill. (Pills are the family trait shared with Wellmate; keep them.)
- Cards: 14 px radius, `--white` on pebble/sand or `--sand` on bone, 1 px `--hair` border, shadow no heavier than `0 1px 0 var(--hair)`.
- Inputs: 10 px radius, sand fill, hair border, euc focus ring.
- Texture: none, this palette wants clean, soft surfaces. No grain, no gradients except a very subtle night → night-deep on the footer.
- Motion: the hero decoration (§6) may drift/breathe (scale 1 → 1.03, 10 s, ease-in-out, infinite); static under `prefers-reduced-motion: reduce`. Nothing else animates except hover transitions ≤ 200 ms.

## 4. Icons

- One set, outline, 1.75 px stroke, round caps and joins, 24 px grid, `currentColor`. Base on Lucide (MIT), hand-adjusted to feel drawn. Inline `<svg aria-hidden="true">` with a visible text label, never icon-only controls.
- Service card icons: sparkles or wand (AI assistants), layers (right-size), shield-check or hand-heart (Tech Care), book-open (AI learning). Step numbers in How-it-works are Literata numerals in euc, not icons.
- Social: Spotify, Apple Podcasts, YouTube, Instagram, port the paths from wellmate.me, recolour via `currentColor`.

## 5. Logo, wordmark only (chosen: "roman + italic halves")

- **No pictorial mark.** The logo is the word set in Literata 500: `Soul` in roman + `craft` in italic, no space, no colour change, ink on light / bone on dark. Letter-spacing −0.01em. Example: <span>Soul<em>craft</em></span>.
- Provide `assets/logo.svg` (text converted to outlines so it does not depend on the webfont; render it with Playwright/resvg from an HTML snippet using the loaded Google Font, or trace via `opentype.js`, commit the outlined SVG), plus `assets/logo-on-dark.svg`.
- **Favicon / app icon** (a wordmark does not read at 16 px): a rounded square (radius 22%) filled euc, with a single Literata italic lowercase **s** in bone centred, optically sized to ~62% of the tile. `assets/favicon.svg`, `assets/apple-touch-icon.png` (180 px), and `assets/og.png` (1200×630: wordmark large on bone, tagline in Karla beneath, a rose rule between them, the favicon tile small in a corner).
- Nav uses the wordmark at ~24 px cap height; footer the on-dark version.

## 6. Imagery & decoration

- Only the portrait (`assets/portrait.jpg`) and the Path Collective logo. No stock photos, no illustrations of robots/circuits/laptops.
- Hero decoration: three soft concentric arcs in euc at 25–40 % opacity, offset to the right, with a small rose dot, a quiet cousin of Wellmate's rings. Hidden < 860 px.
- Portrait treatment: 14 px radius, 1 px hair border, optional rose offset frame (4 px, translated 8 px/8 px) behind it.

## 7. Voice (for layout decisions; copy is fixed in CONTENT.md)

Short lines. One idea per card. Numbers are plain (`$149`, `60 min`). Headings are sentences, not titles. The page should feel like a calm person explaining what they do, not a brochure.
