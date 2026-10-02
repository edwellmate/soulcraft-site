// Full-page screenshots at 360 / 768 / 1280 px → screenshots/ (gitignored).
// Run with the site served on :8080 (python3 -m http.server 8080):
//   npx -p playwright node tools/screenshots.mjs
// Env: BASE_URL (default http://localhost:8080), PW_IGNORE_HTTPS_ERRORS=1 (behind a TLS-intercepting proxy).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL || "http://localhost:8080/";
const ignoreHTTPSErrors = process.env.PW_IGNORE_HTTPS_ERRORS === "1";
const out = "screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ignoreHTTPSErrors ? ["--ignore-certificate-errors"] : [] });
let problems = 0;
for (const width of [360, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, ignoreHTTPSErrors });
  page.on("console", m => { if (m.type() === "error") { problems++; console.log(`[${width}] console.error: ${m.text()}`); } });
  page.on("pageerror", e => { problems++; console.log(`[${width}] pageerror: ${e.message}`); });
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // Walk the page so lazy images and embeds are requested before the capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 80)); }
    window.scrollTo({ top: 0, behavior: "instant" });
    const settled = Array.from(document.images).map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }));
    await Promise.race([Promise.all(settled), new Promise(r => setTimeout(r, 5000))]);
  });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (scrollWidth > width) { problems++; console.log(`[${width}] horizontal overflow: scrollWidth ${scrollWidth}`); }
  const path = `${out}/${width}.png`;
  await page.screenshot({ path, fullPage: true, timeout: 60000 });
  console.log(`${path}  (${width}×${await page.evaluate(() => document.documentElement.scrollHeight)})`);
  await page.close();
}
await browser.close();
console.log(problems ? `${problems} problem(s)` : "No console errors, no horizontal overflow.");
process.exit(problems ? 1 : 0);
