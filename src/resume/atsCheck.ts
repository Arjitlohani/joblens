import type { AtsCheckItem, AtsScore, ResumeData } from './types';
import { buildResumeText } from './buildText';
import { matchResume } from '../engine/matcher';

const ACTION_VERBS =
  /^(built|led|managed|created|designed|developed|delivered|improved|increased|reduced|launched|implemented|automated|coordinated|trained|resolved|streamlined|negotiated|achieved|drove|owned|shipped|served|prepared|operated|maintained|supported|organized|organised|handled|processed|supervised|mentored|analyzed|analysed|optimized|optimised|migrated|tested|deployed|established|grew|generated|saved|won|exceeded)/i;

const HAS_NUMBER = /\d/;

/**
 * Score a resume against ATS best practices. Format concerns (single column,
 * standard headings, no tables or graphics) are guaranteed by the builder
 * itself, so those points are earned by construction; content checks and
 * keyword targeting make up the rest.
 *
 * Weights without a target posting sum to 100. With a target posting the
 * whole score is rebalanced: content 70%, keyword coverage 30%.
 */
export function atsCheck(resume: ResumeData, targetJobText?: string): AtsScore {
  const items: AtsCheckItem[] = [];
  const bullets = resume.experience.flatMap((e) => e.bullets.filter((b) => b.trim()));

  function add(
    id: string,
    label: string,
    available: number,
    passed: boolean,
    tip: string,
    partial?: number,
  ) {
    items.push({
      id,
      label,
      available,
      earned: passed ? available : (partial ?? 0),
      passed,
      tip,
    });
  }

  add(
    'format',
    'ATS-safe format (single column, standard headings, no tables)',
    20,
    true,
    'Guaranteed by the builder — this is the format that scores ~18 points higher in real ATS scans.',
  );

  add(
    'contact',
    'Name + email + phone present',
    10,
    Boolean(resume.fullName.trim() && resume.email.trim() && resume.phone.trim()),
    'ATS parsers look for contact details at the top. Missing phone or email is an instant handicap.',
  );

  const summaryLen = resume.summary.trim().length;
  add(
    'summary',
    'Professional summary (2–4 sentences)',
    10,
    summaryLen >= 80 && summaryLen <= 600,
    'A 2–4 sentence summary is a high-priority keyword zone. Aim for 80–600 characters.',
  );

  const skillCount = resume.skills.length + resume.softSkills.length;
  add(
    'skills',
    'At least 6 skills listed',
    10,
    skillCount >= 6,
    'The skills section is the #1 place ATS software looks for keyword matches.',
    Math.min(skillCount, 5),
  );

  add(
    'experience',
    'At least one role with 2+ bullet points',
    15,
    resume.experience.some((e) => e.bullets.filter((b) => b.trim()).length >= 2),
    'Describe what you did in bullets — parsers and recruiters both read bullets first.',
  );

  const verbShare =
    bullets.length === 0
      ? 0
      : bullets.filter((b) => ACTION_VERBS.test(b.trim())).length / bullets.length;
  add(
    'verbs',
    'Bullets start with action verbs',
    10,
    bullets.length > 0 && verbShare >= 0.7,
    'Start every bullet with a verb: "Built…", "Reduced…", "Served…". Weak: "Responsible for…".',
    Math.round(verbShare * 7),
  );

  const numberShare =
    bullets.length === 0 ? 0 : bullets.filter((b) => HAS_NUMBER.test(b)).length / bullets.length;
  add(
    'numbers',
    'Bullets include numbers (%, $, counts)',
    10,
    bullets.length > 0 && numberShare >= 0.3,
    'Quantify at least a third of your bullets: "cut wait times 20%", "served 200+ covers a night".',
    Math.round(numberShare * 20),
  );

  add(
    'dates',
    'Every role has dates',
    5,
    resume.experience.length > 0 &&
      resume.experience.every((e) => e.start.trim().length > 0),
    'Missing dates make parsers (and recruiters) assume you are hiding a gap.',
  );

  add(
    'education',
    'Education or certification listed',
    5,
    resume.education.some((e) => e.degree || e.school) || resume.certifications.length > 0,
    'Even a short education line helps — many ATS filters require the field to be non-empty.',
  );

  add(
    'length',
    'Substantial content (not a stub)',
    5,
    buildResumeText(resume).length >= 900,
    'Very short resumes score poorly with parsers and humans alike.',
  );

  const contentEarned = items.reduce((s, i) => s + i.earned, 0);
  const contentAvailable = items.reduce((s, i) => s + i.available, 0);

  let keywordCoverage: number | undefined;
  let missingKeywords: string[] = [];
  let score: number;

  if (targetJobText && targetJobText.trim().length >= 40) {
    const match = matchResume(targetJobText, buildResumeText(resume));
    keywordCoverage = match.totalKeywords > 0 ? match.score : undefined;
    missingKeywords = match.missing;
    if (keywordCoverage !== undefined) {
      score = Math.round((contentEarned / contentAvailable) * 70 + (keywordCoverage / 100) * 30);
    } else {
      score = Math.round((contentEarned / contentAvailable) * 100);
    }
  } else {
    score = Math.round((contentEarned / contentAvailable) * 100);
  }

  return { score, items, keywordCoverage, missingKeywords };
}
