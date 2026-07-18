# JobLens 🔍

**X-ray a job posting before you waste an application.**

Paste any job posting and JobLens tells you, in seconds:

- 👻 **Ghost-job risk** — is anyone actually being hired for this role?
- 🛑 **Scam signals** — patterns drawn from FTC consumer alerts on employment fraud
- 🗣️ **Buzzword decoder** — what "fast-paced environment" and "we're like a family" usually mean
- 📋 **Requirements, decoded** — genuine must-haves vs. the wishlist, plus requirements-inflation warnings ("entry level, 5+ years experience")
- 🎯 **ATS resume match** — paste your resume and get keyword coverage, synonym-aware gap analysis, and exact-wording advice

**Privacy-first by design: everything runs in your browser.** Nothing you paste is uploaded, stored, or sent anywhere — the app makes no network requests with your data.

## Why this exists

Job hunting in 2026 is brutal, and the deck is stacked in ways most applicants can't see:

- **~1 in 5 job postings is a "ghost job"** with no hire behind it (Greenhouse, 2025), and **93% of HR professionals admit** posting them at least occasionally (LiveCareer survey of 918 HR professionals, 2025). Reported by [Forbes](https://www.forbes.com/sites/rachelwells/2026/04/09/1-in-7-job-postings-are-ghost-jobs-new-study-reveals-here-are-3-steps-to-avoid-fake-job-ads/) and [CNBC](https://www.cnbc.com/2025/11/11/ghost-job-postings-add-another-layer-of-uncertainty-to-stalled-jobs-picture.html).
- Resumes that match a posting's keywords are **~40% more likely to reach a human**, yet **54% of candidates never tailor** — and the most common failure is having the skill but phrasing it differently than the posting.
- The [FTC warns](https://consumer.ftc.gov/articles/job-scams) about a wave of fake-recruiter scams: upfront payments, checks to deposit, and requests for SSN/bank details before an interview.

Every rule in JobLens maps to one of those documented failure modes. It doesn't promise you a job — it stops you spending hours on postings that were never going to give you one.

## Tech

- **React 19 + TypeScript + Vite** — fully static, deployable anywhere (GitHub Pages, Vercel, Netlify)
- **Pure analysis engine** (`src/engine/`) — every heuristic is a dependency-free, unit-tested TypeScript module:
  - `ghost.ts` — weighted ghost-job risk scoring (posting age, hidden pay, pipeline language, thin/generic descriptions, stale urgency)
  - `scam.ts` — FTC-pattern scam detection with evidence capture
  - `buzzwords.ts` — 20+ corporate-speak translations
  - `requirements.ts` — must-have vs. nice-to-have classification + inflation detection
  - `keywords.ts` / `matcher.ts` — synonym-aware ATS keyword extraction and resume matching across tech, office, and hospitality skills
- **28 unit tests** (Vitest) over realistic posting fixtures — genuine, ghost, and scam

## Run it

```bash
npm install
npm run dev    # local dev server
npm test       # run the engine test suite
npm run build  # static production build in dist/
```

## Disclaimer

JobLens is a decision aid, not a guarantee. A clean report doesn't prove a posting is real, and a flagged posting may still be legitimate. Report suspected employment scams at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov).
