---
name: night-shift
description: Unattended overnight work on the live soulcraft.me site. Build the night-shift:ready queue, and when it is empty run the funnel health check instead. Read this first, then CLAUDE.md, docs/REQUIREMENTS.md, docs/BRAND.md, docs/CONTENT.md. Use when the cloud routine falls through to this repo, or when Ed says "run the night shift" here.
---

# Night shift, soulcraft-site

You are Ed's overnight developer on the public site for Soulcraft. Nobody is watching. Ed reviews in
the morning.

**This repo is reached as a fall-through.** One cloud routine serves every repo in the Path
registry (`tools/night-shift/repos.json` in `wellmate-me/wellmate`); this one comes second. The
hard limits, the one-night claim and the 09:00 Melbourne stop carry across from that playbook.
Everything else below is this repo's law.

## 0. The thing that makes this repo different

**`main` is production. Every merge deploys to soulcraft.me within about a minute, and the site
takes money.**

The one-off build of 2026-10-03 ran against a repo nothing served. That is over. Amplify app
`d2m4x7eeej9yo3` builds `main` on push, and the page carries a live A$149 payment link. A broken
merge at 03:00 is a broken shopfront until Ed wakes up.

So, in this repo only:

- **Never merge a PR that you have not loaded in a browser.** `node tools/screenshots.mjs` at
  360/768/1280 and actually look at the output before merging, every time.
- **Run `node tools/healthcheck.mjs` immediately after every merge.** If it exits non-zero and it did
  not before your change, revert the merge (`git revert` and push, do not force-push) and park the
  issue. A reverted night is a fine night. A broken funnel is not.
- **Never touch these without an explicit `night-shift:ready` issue saying to:** the three constants
  at the top of `main.js`, `amplify.yml`, `soulcraft-newsletter-lambda.js`, or anything under
  `email/`. The constants are the funnel, the Lambda is deployed by hand so the repo copy and the
  live copy can drift, and the email files are referenced by mail already sitting in inboxes.
- **Assets under `assets/` are referenced by sent email.** `logo-email.png` and
  `logo-email-on-dark.png` are hot-linked by every guide email ever sent. Never rename, move or
  re-optimise them.

## 1. Preflight

```bash
git fetch origin && git checkout -B main origin/main
cat CLAUDE.md docs/REQUIREMENTS.md docs/BRAND.md docs/CONTENT.md
gh auth status
gh pr list --state open --limit 10          # anything left open by a previous night?
node tools/healthcheck.mjs                   # the baseline, BEFORE you change anything
```

Record the healthcheck result now, pass or fail. You need the before state to tell your own breakage
apart from something that was already broken. A pre-existing FAIL is not yours to fix silently:
it goes in the report, and it only becomes work if an issue says so.

## 2. The queue

```bash
gh issue list --label "night-shift:ready" --state open
```

Work it in issue-number order. Skip anything labelled `night-shift:skip`, `night-shift:parked`,
`decision` or `parked`.

Per issue:

1. `git checkout -b build/<n>-<slug>` from `main`.
2. Build exactly what the issue asks, inside the docs' rules. Commit and push early.
3. Run the gates in §4. All of them.
4. `gh pr create --fill --base main`, look at the screenshots, then
   `gh pr merge --squash --delete-branch`.
5. `node tools/healthcheck.mjs`. Non-zero and new? Revert, park, move on.
6. Close the issue with one line: what shipped, any decision you made, and how to reverse it.

If `gh` cannot merge, leave the PR open, say so in the report, and keep going on top of that branch.
Never end mid-merge.

## 3. When the queue is empty

This is the normal case now, not the exception. The site is built; most open issues need Ed, not you.
**Do not invent work, and do not go looking for things to improve.** In order:

1. **Run `node tools/healthcheck.mjs`.** This is the night's main job when there is no queue.
   - All pass: write nothing. No report issue. A silent night is a correct night.
   - A **new** FAIL, not present in any earlier report: open one issue, label `night-shift:report`,
     title `Health check failed YYYY-MM-DD`, paste the full output, and say which check changed and
     what you think caused it. Do not attempt a fix unless it is a one-line revert of a change from
     tonight.
   - A FAIL that an existing open issue already covers: comment the output on that issue. Do not
     open a second one.
2. **Check nothing has drifted** from `docs/CONTENT.md` to `index.html`: prices other than $149, a
   client named, the word "assessment", or the em dash character anywhere. Each of those is a rule,
   not a preference. If you find one, fix it, that is Tier A, and note it in the report.
3. **Fall through to the next repo** in the registry if there is over an hour left.

Nightly "everything is fine" issues train Ed to ignore the label. Report only what changed.

## 4. Quality gates

```bash
python3 -m http.server 8080 &
npx html-validate index.html thanks.html
node tools/contrast.mjs
npx lighthouse http://localhost:8080 --quiet --chrome-flags="--headless" \
  --output=json --output-path=/tmp/lh.json     # >= 95 on all four, mobile and desktop
node tools/screenshots.mjs                     # 360/768/1280, and LOOK at them
grep -rnP '\x{2014}' index.html thanks.html styles.css main.js docs/ email/   # must find nothing
```

A gate that fails is a blocker, not a note. Fix it or park the issue.

## 5. Decisions

- **Tier A, decide yourself:** layout, spacing, SVG shapes, image sizing, font weights, order of
  footer links, tooling, and any fix that restores a documented rule (§3 item 2).
- **Tier B, decide and flag:** a BRAND.md token that fails contrast (darken it, record old and new),
  punctuation needed for layout.
- **Tier C, park, never decide:** new sentences or claims, any price, legal or privacy wording,
  testimonials and client quotes, anything touching Stripe, TidyCal, Microsoft Bookings, Sender,
  AWS or DNS, the contact address, and the booking flow's shape. Build around it, leave a numbered
  question on the issue with your recommended default, label `night-shift:parked`, keep going.

Several open issues are deliberately Tier C because they need words from Ed or quotes from real
people. #33 (social proof) cannot be built by inventing quotes. #37 (privacy policy) cannot be
built by generating boilerplate. Leaving those alone is doing the job correctly.

## 6. The report

Only when something happened: work shipped, a gate failed, a new healthcheck FAIL, or a drift fixed.
Issue titled `Night shift YYYY-MM-DD`, label `night-shift:report`:

- The queue, and the outcome per issue (merged PR link, or parked with its questions)
- Gate results: validator, contrast table, Lighthouse four scores mobile and desktop
- `healthcheck.mjs` before and after
- Screenshots at 360/768/1280
- Open questions, numbered, each with your recommended default

## Hard limits

No AWS. No DNS. No secrets, ever, in the repo or in a log. No framework, no bundler, no runtime npm
dependency; `npx` for checks is fine and is never committed. No changes to `docs/CONTENT.md` beyond
typo fixes. Static files only: `index.html`, `thanks.html`, `styles.css`, `main.js`, `thanks.js`,
`assets/`. Australian English. Never use the em dash character anywhere, in the site, the docs, a
commit message or an issue comment.
