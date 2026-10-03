---
name: night-shift
description: Unattended overnight build of soulcraft.me from the GitHub issue queue. Read this first, then docs/REQUIREMENTS.md, docs/BRAND.md, docs/CONTENT.md.
---

# Night shift — soulcraft-site

You are building a small static website unattended. Ed reviews in the morning. Work the queue in order, ship each issue as a merged PR, leave one report issue.

## 0. Preflight (5 min)
1. `gh auth status`; `git checkout main && git pull`.
2. Read `CLAUDE.md`, `docs/REQUIREMENTS.md`, `docs/BRAND.md`, `docs/CONTENT.md` fully.
3. Queue: `gh issue list --label night-shift:ready --state open --json number,title --jq 'sort_by(.number)'`. Skip anything labelled `night-shift:skip`, `decision`, `parked`, or `night-shift:parked`.
4. Create the report issue now: title `Night shift YYYY-MM-DD`, label `night-shift:report`, body = the ordered queue. Update it as you go so a dead session still leaves a trail.

## 1. Per-issue loop
1. `git checkout -b build/<n>-<slug>` from `main`.
2. Build exactly what the issue asks, inside the docs' rules. Commit early and push early.
3. Run the checks in `CLAUDE.md` that apply (all of them from issue #8 onwards).
4. `gh pr create --fill --base main`, then `gh pr merge --squash --delete-branch`. If merge is refused, leave the PR open, say so in the report, and continue on top of that branch.
5. Close the issue with a one-line comment (what shipped, any decision made and how to reverse it).

## 2. Decisions
- **Decide yourself (Tier A):** layout, spacing, icon choice, SVG shapes, image sizing, font weights, order of footer links, tooling.
- **Decide and flag (Tier B):** anything in BRAND.md that fails a contrast check (darken the token, record old/new), copy punctuation for layout.
- **Park (Tier C):** new sentences or claims, prices, legal wording, anything about Stripe/Microsoft Bookings/Sender/AWS/DNS accounts, contact email changes. Build around it, leave a numbered question on the issue, label `night-shift:parked`, keep going.

## 3. Report (end of run, or hard stop at 09:00 Melbourne)
In the report issue: queue → per-issue outcome (merged PR link / parked + questions) → quality gate results (validator, contrast table, Lighthouse four scores for mobile and desktop) → screenshots at 360/768/1280 (upload via `gh issue comment --body-file` with images attached, or commit nothing and paste the Playwright output paths plus a note) → **Morning checklist for Ed** (copy the `night-shift:skip` issues in order) → open questions numbered, each with your recommended default.

Guard-rails: no AWS, no DNS, no secrets, no npm runtime deps, no changes to `docs/CONTENT.md` beyond typo fixes. Never end mid-merge.
