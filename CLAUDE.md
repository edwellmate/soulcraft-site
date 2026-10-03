# soulcraft-site

Public site for Soulcraft (Eduardo Rivas's tech & AI consultancy for the wellness world). Static HTML on AWS Amplify, apex `soulcraft.me`. Sister of `edwellmate/wellmate-site`, which it will replace.

## Read first
- `docs/REQUIREMENTS.md`, what to build and the quality gates
- `docs/BRAND.md`, tokens, type, icons, logo brief
- `docs/CONTENT.md`, every word on the page (copy is fixed; park wording questions, do not invent)
- `docs/DEPLOY.md`, Amplify, Lambda, DNS (Ed's job, not the agent's)

## Rules
- Static only: `index.html`, `styles.css`, `main.js`, `assets/`. No framework, no bundler, no runtime npm deps. `npx` tooling for checks is fine, never committed.
- No base64 photos in HTML. SVG inline or in `assets/`.
- Secrets never in the repo. `STRIPE_LINK`, `BOOKING_URL`, `FORM_ENDPOINT` are public URLs filled by Ed; leave them empty strings.
- The Lambda emits **no** CORS headers, the Function URL config does.
- Copy = `docs/CONTENT.md`. Prices: only `$149`. Never name clients. Never use the word "assessment" on the page.
- Australian English.
- One PR per issue, squash-merge to `main`, close the issue with a one-line summary. Branch names `build/<issue-number>-<slug>`.

## Checks before any merge
`python3 -m http.server 8080` then: `npx html-validate index.html` · `node tools/contrast.mjs` · `npx lighthouse http://localhost:8080 --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh.json` (≥ 95 ×4) · `node tools/screenshots.mjs` (360/768/1280).
