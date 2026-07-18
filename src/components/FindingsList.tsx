import type { Finding, Severity } from '../engine/types';

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--critical)',
  warning: 'var(--serious)',
  caution: 'var(--warning)',
  info: 'var(--accent)',
  positive: 'var(--good)',
};

const SEVERITY_TEXT: Record<Severity, string> = {
  critical: 'critical',
  warning: 'warning',
  caution: 'caution',
  info: 'info',
  positive: 'good sign',
};

interface Props {
  findings: Finding[];
  emptyMessage: string;
}

export function FindingsList({ findings, emptyMessage }: Props) {
  if (findings.length === 0) {
    return (
      <p className="all-clear">
        <span aria-hidden="true">✓</span> {emptyMessage}
      </p>
    );
  }
  return (
    <div>
      {findings.map((f) => (
        <div className="finding" key={f.id}>
          <div className="finding-head">
            <span className="sev" style={{ ['--sev-color' as string]: SEVERITY_COLOR[f.severity] }}>
              {SEVERITY_TEXT[f.severity]}
            </span>
            <span>{f.label}</span>
          </div>
          <p className="finding-detail">{f.detail}</p>
          {f.evidence && <span className="evidence">found: “{f.evidence}”</span>}
        </div>
      ))}
    </div>
  );
}
