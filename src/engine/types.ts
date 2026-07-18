/** Shared types for the JobLens analysis engine. */

export type Severity = 'critical' | 'warning' | 'caution' | 'info' | 'positive';

export interface Finding {
  /** Stable id for the rule that produced this finding. */
  id: string;
  /** Short human-readable label. */
  label: string;
  /** Longer explanation shown when the user expands the finding. */
  detail: string;
  severity: Severity;
  /** Contribution to the parent score, 0–100 scale. */
  weight: number;
  /** The exact text in the posting that triggered the rule, if any. */
  evidence?: string;
}

export type PostingAge = 'under1w' | '1to4w' | '1to3m' | 'over3m' | 'unknown';

export interface GhostReport {
  /** 0 (almost certainly real) – 100 (almost certainly a ghost posting). */
  score: number;
  level: 'low' | 'moderate' | 'high';
  findings: Finding[];
}

export interface ScamReport {
  /** 0 (no scam signals) – 100 (multiple critical scam signals). */
  score: number;
  level: 'clear' | 'suspicious' | 'danger';
  findings: Finding[];
}

export interface BuzzwordHit {
  phrase: string;
  translation: string;
  severity: Severity;
}

export interface SalaryReport {
  disclosed: boolean;
  /** Raw matched text, e.g. "$60,000 – $80,000 per year". */
  text?: string;
  min?: number;
  max?: number;
  /** True when the range is so wide it carries no information. */
  suspiciouslyWide: boolean;
}

export interface RequirementItem {
  text: string;
  kind: 'must' | 'nice';
  /** Years of experience demanded by this line, if stated. */
  years?: number;
}

export interface RequirementsReport {
  items: RequirementItem[];
  mustCount: number;
  niceCount: number;
  maxYears?: number;
  /** e.g. "entry level" posting demanding 5+ years. */
  inflationFindings: Finding[];
}

export interface KeywordMatch {
  keyword: string;
  /** How the resume satisfied it: exact text, or via a known synonym. */
  matchedVia?: string;
  matched: boolean;
}

export interface MatchReport {
  /** 0–100 coverage of the posting's keywords by the resume. */
  score: number;
  matches: KeywordMatch[];
  matchedCount: number;
  totalKeywords: number;
  /** Keywords worth adding, most important first. */
  missing: string[];
}

export type Verdict = 'apply' | 'caution' | 'skip' | 'scam';

export interface Analysis {
  ghost: GhostReport;
  scam: ScamReport;
  buzzwords: BuzzwordHit[];
  salary: SalaryReport;
  requirements: RequirementsReport;
  /** Only present when a resume was provided. */
  match?: MatchReport;
  verdict: Verdict;
  verdictReason: string;
  wordCount: number;
}
