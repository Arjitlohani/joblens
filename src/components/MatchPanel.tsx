import type { MatchReport } from '../engine/types';

interface Props {
  match: MatchReport;
}

function matchColor(score: number): string {
  if (score >= 60) return 'var(--good)';
  if (score >= 35) return 'var(--warning)';
  return 'var(--serious)';
}

/** ATS keyword coverage: matched chips, wording mismatches, and the gap list. */
export function MatchPanel({ match }: Props) {
  const matched = match.matches.filter((m) => m.matched);
  const wordingMismatches = matched.filter(
    (m) => m.matchedVia !== undefined && m.matchedVia !== m.keyword,
  );

  return (
    <div className="section">
      <h3>ATS resume match — {match.score}% keyword coverage</h3>
      <p className="section-sub">
        {match.matchedCount} of {match.totalKeywords} keywords from the posting appear in your
        resume. Research on real ATS scans puts the sweet spot at 60–80% coverage — above that
        starts to read as keyword stuffing.
      </p>

      {matched.length > 0 && (
        <>
          <strong>In your resume</strong>
          <div className="chips">
            {matched.map((m) => (
              <span
                className="chip"
                key={m.keyword}
                style={{ ['--chip-color' as string]: matchColor(100) }}
              >
                ✓ {m.keyword}
                {m.matchedVia !== m.keyword && <span className="via"> (as “{m.matchedVia}”)</span>}
              </span>
            ))}
          </div>
        </>
      )}

      {match.missing.length > 0 && (
        <>
          <strong style={{ display: 'block', marginTop: 16 }}>Missing from your resume</strong>
          <div className="chips">
            {match.missing.map((k) => (
              <span
                className="chip"
                key={k}
                style={{ ['--chip-color' as string]: 'var(--serious)' }}
              >
                + {k}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="match-advice">
        <strong>How to use this:</strong> only add missing keywords you genuinely have — then say
        them the way the posting says them.
        {wordingMismatches.length > 0 && (
          <>
            {' '}
            You already have {wordingMismatches.length === 1 ? 'a skill' : 'skills'} the posting
            asks for under different wording (
            {wordingMismatches
              .map((m) => `you say “${m.matchedVia}”, they say “${m.keyword}”`)
              .join('; ')}
            ). ATS software often matches literally — mirror the posting's exact terms.
          </>
        )}{' '}
        Put the most important ones in your summary, skills section, and the first bullet of your
        most recent role.
      </div>
    </div>
  );
}
