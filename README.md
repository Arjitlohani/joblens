# JobLens 🔍

**The privacy-first job-hunt toolkit: build, search, verify.**

Three tools in one page:

### 📄 Resume Builder
Fill in your details and get a **live ATS-readiness score (0–100)** with a point-by-point checklist: action verbs, quantified bullets, keyword zones, contact completeness. Optionally paste a target job posting and the score includes **keyword coverage against that exact job**. Download as PDF (via a deliberately single-column, graphics-free print layout — the format that scores ~18 points higher in real ATS scans) or as plain .txt. Your data saves to your own browser's localStorage and never leaves your device.

### 🔎 Job Search
Search live listings from free public job feeds (Remotive, Arbeitnow). The killer feature: **every result is auto-scanned by the JobLens analysis engine** and badged — Looks clean / Some flags / Ghost-job signals / Scam signals — before you click. One click hands any listing to the full analyzer. Only your search term is sent to the feeds; nothing else ever leaves the page.

### 🛡️ Check a Posting
Paste any job posting and get a verdict in seconds:

- 👻 **Ghost-job risk** — is anyone actually being hired for this role?
- 🛑 **Scam signals** — patterns drawn from FTC consumer alerts on employment fraud
- 🗣️ **Buzzword decoder** — what "fast-paced environment" and "we're like a family" usually mean
- 📋 **Requirements, decoded** — genuine must-haves vs. the wishlist, plus requirements-inflation warnings ("entry level, 5+ years experience")
- 🎯 **ATS resume match** — keyword coverage with synonym-aware gap analysis and exact-wording advice

## Why this exists

Job hunting in 2026 is brutal, and the deck is stacked in ways most applicants can't see:

- **~1 in 5 job postings is a "ghost job"** with no hire behind it (Greenhouse, 2025), and **93% of HR professionals admit** posting them at least occasionally (LiveCareer survey of 918 HR professionals, 2025). Reported by [Forbes](https://www.forbes.com/sites/rachelwells/2026/04/09/1-in-7-job-postings-are-ghost-jobs-new-study-reveals-here-are-3-steps-to-avoid-fake-job-ads/) and [CNBC](https://www.cnbc.com/2025/11/11/ghost-job-postings-add-another-layer-of-uncertainty-to-stalled-jobs-picture.html).
- Resumes that match a posting's keywords are **~40% more likely to reach a human**, yet **54% of candidates never tailor** — and the most common failure is having the skill but phrasing it differently than the posting.
- The [FTC warns](https://consumer.ftc.gov/articles/job-scams) about a wave of fake-recruiter scams: upfront payments, checks to deposit, and requests for SSN/bank details before an interview.

Every rule in JobLens maps to one of those documented failure modes. It doesn't promise you a job — it stops you spending hours on postings that were never going to give you one.

## Tech

- **React 19 + TypeScript + Vite** — fully static, deployable anywhere (GitHub Pages, Vercel, Netlify)
- **Resume engine** (`src/resume/`) — data model, plain-text assembly with standard ATS headings, and a weighted scoring rubric (`atsCheck.ts`) that rebalances to 70% content / 30% keyword coverage when targeting a posting
- **Job search** (`src/jobsearch/`) — keyless public APIs, per-source failure tolerance, HTML-stripped normalization
- **Pure analysis engine** (`src/engine/`) — every heuristic is a dependency-free, unit-tested TypeScript module:
  - `ghost.ts` — weighted ghost-job risk scoring (posting age, hidden pay, pipeline language, thin/generic descriptions, stale urgency)
  - `scam.ts` — FTC-pattern scam detection with evidence capture
  - `buzzwords.ts` — 20+ corporate-speak translations
  - `requirements.ts` — must-have vs. nice-to-have classification + inflation detection
  - `keywords.ts` / `matcher.ts` — synonym-aware ATS keyword extraction and resume matching across tech, office, and hospitality skills
- **36 unit tests** (Vitest) over realistic fixtures — genuine, ghost, and scam postings plus resume scoring

## Run it

```bash
npm install
npm run dev    # local dev server
npm test       # run the engine test suite
npm run build  # static production build in dist/
```

## Disclaimer

JobLens is a decision aid, not a guarantee. A clean report doesn't prove a posting is real, and a flagged posting may still be legitimate. Report suspected employment scams at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov).
