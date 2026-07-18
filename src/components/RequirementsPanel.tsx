import type { RequirementsReport } from '../engine/types';
import { FindingsList } from './FindingsList';

interface Props {
  requirements: RequirementsReport;
}

/** Must-have vs wishlist split, plus requirements-inflation warnings. */
export function RequirementsPanel({ requirements }: Props) {
  const musts = requirements.items.filter((i) => i.kind === 'must');
  const nices = requirements.items.filter((i) => i.kind === 'nice');

  if (requirements.items.length === 0 && requirements.inflationFindings.length === 0) {
    return null;
  }

  return (
    <div className="section">
      <h3>Requirements, decoded</h3>
      <p className="section-sub">
        Postings describe a fantasy candidate. Recruiters themselves advise applying when you meet
        roughly 60% of the list — treat “required” as “strongly preferred”.
      </p>

      {requirements.inflationFindings.length > 0 && (
        <FindingsList findings={requirements.inflationFindings} emptyMessage="" />
      )}

      {requirements.items.length > 0 && (
        <div className="req-columns" style={{ marginTop: 14 }}>
          <div className="req-col">
            <h4>
              Likely must-haves ({musts.length})
            </h4>
            {musts.map((i, idx) => (
              <div
                className="req-item"
                key={idx}
                style={{ ['--req-color' as string]: 'var(--accent)' }}
              >
                {i.text}
              </div>
            ))}
            {musts.length === 0 && <div className="req-item" style={{ ['--req-color' as string]: 'var(--border)' }}>None clearly stated.</div>}
          </div>
          <div className="req-col">
            <h4>Wishlist / nice-to-have ({nices.length})</h4>
            {nices.map((i, idx) => (
              <div
                className="req-item"
                key={idx}
                style={{ ['--req-color' as string]: 'var(--ink-muted)' }}
              >
                {i.text}
              </div>
            ))}
            {nices.length === 0 && <div className="req-item" style={{ ['--req-color' as string]: 'var(--border)' }}>None clearly stated.</div>}
          </div>
        </div>
      )}

      <div className="req-note">
        Don't self-reject. Missing a “nice to have” costs you nothing; missing one or two
        “must-haves” usually doesn't either — the posting, not you, is the wishlist.
      </div>
    </div>
  );
}
