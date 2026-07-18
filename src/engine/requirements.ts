import type { Finding, RequirementItem, RequirementsReport } from './types';
import { toLines } from './textUtils';

const MUST_CUES =
  /\b(must|required|require[sd]?|essential|minimum|mandatory|need to have|you have|you will need|proven|demonstrated)\b/i;

const NICE_CUES =
  /\b(nice to have|preferred|a plus|bonus|ideally|desirable|advantageous|would be great|not required|nice-to-have|is a bonus|beneficial)\b/i;

const YEARS = /(\d+)\s*\+?\s*(?:-\s*\d+\s*)?years?/i;

const ENTRY_LEVEL = /\b(entry[ -]level|junior|graduate|intern(ship)?|no experience|early career)\b/i;

/** Lines that look like requirements rather than prose or benefits. */
function looksLikeRequirement(line: string): boolean {
  if (line.length < 8 || line.length > 300) return false;
  // Section headers like "Nice to have:" or "Requirements:" are not items.
  if (/^[^.!?]{0,40}:$/.test(line)) return false;
  return (
    MUST_CUES.test(line) ||
    NICE_CUES.test(line) ||
    YEARS.test(line) ||
    /\b(experience|degree|proficien|knowledge of|familiar|ability to|skill)/i.test(line)
  );
}

/**
 * Split a posting's requirement lines into genuine must-haves and the
 * wishlist, and flag requirements inflation (e.g. "entry level, 5+ years").
 */
export function analyzeRequirements(text: string): RequirementsReport {
  const lines = toLines(text);
  const items: RequirementItem[] = [];

  for (const line of lines) {
    if (!looksLikeRequirement(line)) continue;
    const kind: RequirementItem['kind'] = NICE_CUES.test(line) ? 'nice' : 'must';
    const y = line.match(YEARS);
    items.push({
      text: line,
      kind,
      years: y ? parseInt(y[1], 10) : undefined,
    });
  }

  const mustCount = items.filter((i) => i.kind === 'must').length;
  const niceCount = items.length - mustCount;
  const years = items.map((i) => i.years).filter((y): y is number => y !== undefined);
  const maxYears = years.length > 0 ? Math.max(...years) : undefined;

  const inflationFindings: Finding[] = [];

  if (ENTRY_LEVEL.test(text) && maxYears !== undefined && maxYears >= 3) {
    inflationFindings.push({
      id: 'entry-level-inflation',
      label: `"Entry level" but demands ${maxYears}+ years of experience`,
      detail:
        'A contradiction in terms, and a well-known symptom of requirements inflation. Apply anyway if you meet roughly half the list — the posting, not you, is the problem.',
      severity: 'warning',
      weight: 0,
    });
  }

  if (mustCount >= 12) {
    inflationFindings.push({
      id: 'wishlist-posting',
      label: `${mustCount} "required" items is a wishlist, not a job`,
      detail:
        'Postings with a dozen or more hard requirements are describing an imaginary candidate. Recruiters themselves advise applying when you meet ~60% of the list.',
      severity: 'caution',
      weight: 0,
    });
  }

  if (maxYears !== undefined && maxYears >= 10) {
    inflationFindings.push({
      id: 'decade-demand',
      label: `Demands ${maxYears}+ years of experience`,
      detail:
        'Ultra-specific experience demands often exist to justify a pre-selected internal candidate or a visa filing — another documented ghost-posting pattern.',
      severity: 'caution',
      weight: 0,
    });
  }

  return { items, mustCount, niceCount, maxYears, inflationFindings };
}
