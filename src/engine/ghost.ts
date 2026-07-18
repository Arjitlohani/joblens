import type { Finding, GhostReport, PostingAge, SalaryReport } from './types';
import { firstPhraseFound, normalize, wordCount } from './textUtils';

const PIPELINE_PHRASES = [
  'talent pipeline',
  'talent pool',
  'future opportunities',
  'future openings',
  'future roles',
  'always accepting applications',
  'always hiring',
  'evergreen',
  'building a pool',
  'general application',
  'ongoing basis',
  'accepting applications on a rolling basis',
  'may become available',
];

const URGENCY_PHRASES = ['urgently hiring', 'urgent requirement', 'immediate hire'];

const SPECIFICS_PATTERNS: RegExp[] = [
  /report(s|ing)? (directly )?to/i, // names a manager or reporting line
  /\bteam of \d+/i,
  /\byour (first|initial) (30|60|90)\b/i,
  /\binterview process\b/i,
  /\bstart date\b/i,
  /\bdeadline\b/i,
  /\bapply by\b/i,
];

const AGE_WEIGHT: Record<PostingAge, number> = {
  under1w: 0,
  '1to4w': 5,
  '1to3m': 20,
  over3m: 35,
  unknown: 5,
};

/**
 * Score the likelihood that a posting is a "ghost job" — advertised with no
 * intent to fill. Signals are drawn from 2025–2026 reporting: stale postings,
 * hidden pay, pipeline language, and descriptions with no concrete specifics.
 */
export function analyzeGhost(
  text: string,
  age: PostingAge,
  salary: SalaryReport,
): GhostReport {
  const norm = normalize(text);
  const findings: Finding[] = [];

  const ageWeight = AGE_WEIGHT[age];
  if (ageWeight > 0 && age !== 'unknown') {
    findings.push({
      id: 'stale-posting',
      label: age === 'over3m' ? 'Posted more than 3 months ago' : 'Posting is not fresh',
      detail:
        'Most genuine roles fill within 30–45 days. A listing open for 90+ days is well past its expected lifecycle — a leading ghost-job indicator.',
      severity: age === 'over3m' ? 'warning' : 'caution',
      weight: ageWeight,
    });
  }

  if (!salary.disclosed) {
    findings.push({
      id: 'no-salary',
      label: 'No salary range disclosed',
      detail:
        'Roles without a budgeted, published pay range are disproportionately represented among ghost postings — and several US states now require disclosure by law.',
      severity: 'warning',
      weight: 20,
    });
  } else if (salary.suspiciouslyWide) {
    findings.push({
      id: 'meaningless-range',
      label: 'Salary range is too wide to mean anything',
      detail: `"${salary.text}" spans so much that it suggests the role has no fixed budget — common in pipeline postings.`,
      severity: 'caution',
      weight: 10,
      evidence: salary.text,
    });
  }

  const pipeline = firstPhraseFound(norm, PIPELINE_PHRASES);
  if (pipeline) {
    findings.push({
      id: 'pipeline-language',
      label: 'Talent-pipeline language',
      detail:
        '50% of HR professionals say the #1 reason for ghost postings is building a candidate pipeline for roles that do not exist yet. This posting uses that exact language.',
      severity: 'warning',
      weight: 30,
      evidence: pipeline,
    });
  }

  const words = wordCount(text);
  if (words > 0 && words < 120) {
    findings.push({
      id: 'thin-description',
      label: 'Very thin description',
      detail:
        'Real, budgeted roles usually describe the actual work. A description this short suggests nobody scoped the job — because nobody is being hired for it.',
      severity: 'caution',
      weight: 15,
    });
  }

  const hasSpecifics = SPECIFICS_PATTERNS.some((re) => re.test(text));
  if (!hasSpecifics && words >= 120) {
    findings.push({
      id: 'no-specifics',
      label: 'No concrete specifics',
      detail:
        'No manager, team size, start date, deadline, or interview process is mentioned. Generic, copy-paste descriptions are typical of evergreen postings.',
      severity: 'caution',
      weight: 10,
    });
  }

  const urgency = firstPhraseFound(norm, URGENCY_PHRASES);
  if (urgency && (age === 'over3m' || age === '1to3m')) {
    findings.push({
      id: 'stale-urgency',
      label: '"Urgently hiring" — for months',
      detail:
        'A posting that has been "urgent" for over a month is not urgent. This combination is a strong ghost-job tell.',
      severity: 'warning',
      weight: 15,
      evidence: urgency,
    });
  }

  const score = Math.min(100, findings.reduce((s, f) => s + f.weight, 0));
  const level = score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low';
  return { score, level, findings };
}
