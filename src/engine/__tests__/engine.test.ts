import { describe, expect, it } from 'vitest';
import { analyze } from '../analyze';
import { analyzeSalary } from '../salary';
import { analyzeScam } from '../scam';
import { analyzeGhost } from '../ghost';
import { decodeBuzzwords } from '../buzzwords';
import { analyzeRequirements } from '../requirements';
import { extractKeywords } from '../keywords';
import { matchResume } from '../matcher';
import { containsPhrase, normalize } from '../textUtils';
import { GENUINE_POSTING, GHOST_POSTING, SCAM_POSTING, SAMPLE_RESUME } from './fixtures';

describe('textUtils.containsPhrase', () => {
  it('matches whole words only', () => {
    expect(containsPhrase(normalize('we use React here'), 'react')).toBe(true);
    expect(containsPhrase(normalize('reactive programming'), 'react')).toBe(false);
  });

  it('is safe for regex metacharacters like c++', () => {
    expect(containsPhrase(normalize('experience with C++ required'), 'c++')).toBe(true);
    expect(containsPhrase(normalize('experience with C required'), 'c++')).toBe(false);
  });
});

describe('salary', () => {
  it('parses an annual range', () => {
    const s = analyzeSalary('Salary: $70,000 - $85,000 per year');
    expect(s.disclosed).toBe(true);
    expect(s.min).toBe(70000);
    expect(s.max).toBe(85000);
    expect(s.suspiciouslyWide).toBe(false);
  });

  it('parses k-suffixed ranges', () => {
    const s = analyzeSalary('We pay $70k–$85k depending on experience');
    expect(s.min).toBe(70000);
    expect(s.max).toBe(85000);
  });

  it('flags a meaninglessly wide range', () => {
    const s = analyzeSalary('Compensation: $40,000 to $150,000');
    expect(s.disclosed).toBe(true);
    expect(s.suspiciouslyWide).toBe(true);
  });

  it('reports undisclosed salary', () => {
    const s = analyzeSalary('We offer a competitive salary and great culture.');
    expect(s.disclosed).toBe(false);
  });

  it('parses hourly rates', () => {
    const s = analyzeSalary('Pay: $25 - $30 per hour');
    expect(s.disclosed).toBe(true);
    expect(s.min).toBe(25);
  });
});

describe('scam detection', () => {
  it('flags the scam fixture as danger with multiple critical findings', () => {
    const r = analyzeScam(SCAM_POSTING);
    expect(r.level).toBe('danger');
    const ids = r.findings.map((f) => f.id);
    expect(ids).toContain('sensitive-info-early');
    expect(ids).toContain('money-movement');
    expect(ids).toContain('personal-email');
    expect(ids).toContain('chat-app-interview');
    expect(ids).toContain('too-good');
  });

  it('keeps a genuine posting clear', () => {
    const r = analyzeScam(GENUINE_POSTING);
    expect(r.level).toBe('clear');
    expect(r.findings).toHaveLength(0);
  });

  it('captures evidence text for findings', () => {
    const r = analyzeScam('Please contact recruiter99@gmail.com to apply.');
    const f = r.findings.find((x) => x.id === 'personal-email');
    expect(f?.evidence).toBe('recruiter99@gmail.com');
  });
});

describe('ghost detection', () => {
  it('rates the ghost fixture high even without age info', () => {
    const salary = analyzeSalary(GHOST_POSTING);
    const r = analyzeGhost(GHOST_POSTING, 'unknown', salary);
    expect(r.level).toBe('high');
    const ids = r.findings.map((f) => f.id);
    expect(ids).toContain('pipeline-language');
    expect(ids).toContain('no-salary');
  });

  it('adds stale-posting weight for 3+ month old listings', () => {
    const salary = analyzeSalary(GENUINE_POSTING);
    const fresh = analyzeGhost(GENUINE_POSTING, 'under1w', salary);
    const stale = analyzeGhost(GENUINE_POSTING, 'over3m', salary);
    expect(stale.score).toBeGreaterThan(fresh.score);
    expect(stale.findings.map((f) => f.id)).toContain('stale-posting');
  });

  it('rates a genuine, fresh posting low', () => {
    const salary = analyzeSalary(GENUINE_POSTING);
    const r = analyzeGhost(GENUINE_POSTING, 'under1w', salary);
    expect(r.level).toBe('low');
  });

  it('flags stale urgency', () => {
    const text = 'Urgently hiring a cashier. Salary $18 per hour. Great team.';
    const r = analyzeGhost(text, 'over3m', analyzeSalary(text));
    expect(r.findings.map((f) => f.id)).toContain('stale-urgency');
  });
});

describe('buzzword decoder', () => {
  it('decodes classic phrases', () => {
    const hits = decodeBuzzwords(GHOST_POSTING);
    const phrases = hits.map((h) => h.phrase);
    expect(phrases).toContain('fast-paced environment');
    expect(phrases).toContain('wear many hats');
    expect(phrases).toContain('we’re like a family');
    expect(phrases).toContain('competitive salary (no numbers)');
  });

  it('returns nothing for plain language', () => {
    expect(decodeBuzzwords('We are hiring a plumber. Pay is $40/hour.')).toHaveLength(0);
  });
});

describe('requirements decoder', () => {
  it('separates must-haves from nice-to-haves', () => {
    const r = analyzeRequirements(GENUINE_POSTING);
    expect(r.mustCount).toBeGreaterThan(0);
    expect(r.niceCount).toBeGreaterThan(0);
    const nice = r.items.filter((i) => i.kind === 'nice');
    expect(nice.some((i) => /graphql/i.test(i.text))).toBe(true);
  });

  it('extracts years of experience', () => {
    const r = analyzeRequirements('Must have 5+ years experience in sales.');
    expect(r.maxYears).toBe(5);
  });

  it('flags entry-level inflation', () => {
    const r = analyzeRequirements(
      'Entry level marketing assistant. Requirements: 5+ years of experience required.',
    );
    expect(r.inflationFindings.map((f) => f.id)).toContain('entry-level-inflation');
  });

  it('flags decade-long experience demands', () => {
    const r = analyzeRequirements(GHOST_POSTING);
    expect(r.inflationFindings.map((f) => f.id)).toContain('decade-demand');
  });
});

describe('keyword extraction and resume matching', () => {
  it('extracts ranked keywords from a posting', () => {
    const kws = extractKeywords(GENUINE_POSTING);
    const canon = kws.map((k) => k.canonical);
    expect(canon).toContain('react');
    expect(canon).toContain('typescript');
    expect(canon).toContain('git');
  });

  it('matches via synonyms (github satisfies git)', () => {
    const m = matchResume('We need Git experience.', 'I use GitHub daily.');
    expect(m.matchedCount).toBe(1);
    expect(m.matches[0].matchedVia).toBe('github');
  });

  it('scores the sample resume against the genuine posting', () => {
    const m = matchResume(GENUINE_POSTING, SAMPLE_RESUME);
    expect(m.score).toBeGreaterThan(40);
    expect(m.missing.length).toBeGreaterThan(0);
    // TypeScript is in the posting but not the resume.
    expect(m.missing).toContain('typescript');
  });

  it('returns zero for an empty match', () => {
    const m = matchResume('We need a licensed electrician.', 'I bake bread.');
    expect(m.score).toBe(0);
  });
});

describe('full analysis + verdict', () => {
  it('says apply for the genuine posting', () => {
    const a = analyze({ jobText: GENUINE_POSTING, postingAge: 'under1w' });
    expect(a.verdict).toBe('apply');
    expect(a.salary.disclosed).toBe(true);
  });

  it('says scam for the scam posting', () => {
    const a = analyze({ jobText: SCAM_POSTING });
    expect(a.verdict).toBe('scam');
  });

  it('says skip for the ghost posting', () => {
    const a = analyze({ jobText: GHOST_POSTING, postingAge: 'over3m' });
    expect(a.verdict).toBe('skip');
  });

  it('includes a match report only when a resume is provided', () => {
    const withResume = analyze({ jobText: GENUINE_POSTING, resumeText: SAMPLE_RESUME });
    const withoutResume = analyze({ jobText: GENUINE_POSTING });
    expect(withResume.match).toBeDefined();
    expect(withoutResume.match).toBeUndefined();
  });
});
