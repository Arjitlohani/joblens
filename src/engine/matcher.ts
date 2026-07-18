import type { KeywordMatch, MatchReport } from './types';
import { extractKeywords, findInResume } from './keywords';

/**
 * Compare a resume against a posting's extracted keywords.
 *
 * Matching is synonym-aware: writing "customer support" satisfies a posting
 * that says "client relations". But because real ATS software often matches
 * literally, matches made via a *different* surface form are surfaced so the
 * UI can advise mirroring the posting's exact wording.
 */
export function matchResume(jobText: string, resumeText: string): MatchReport {
  const keywords = extractKeywords(jobText);
  const matches: KeywordMatch[] = keywords.map((k) => {
    const found = findInResume(k.canonical, resumeText);
    return {
      keyword: k.jdForm,
      matched: found !== undefined,
      matchedVia: found,
    };
  });

  const matchedCount = matches.filter((m) => m.matched).length;
  const totalKeywords = matches.length;
  const score = totalKeywords === 0 ? 0 : Math.round((matchedCount / totalKeywords) * 100);
  const missing = matches.filter((m) => !m.matched).map((m) => m.keyword);

  return { score, matches, matchedCount, totalKeywords, missing };
}
