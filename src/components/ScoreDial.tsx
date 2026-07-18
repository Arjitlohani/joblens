interface Props {
  title: string;
  /** 0–100. */
  value: number;
  /** Status color for the ring and chip. */
  color: string;
  /** Short level text, e.g. "High risk". */
  levelLabel: string;
  /** Icon accompanying the level so color never carries meaning alone. */
  levelIcon: string;
}

const R = 52;
const CIRC = 2 * Math.PI * R;

/** Circular 0–100 gauge with a hero number and an icon+label status chip. */
export function ScoreDial({ title, value, color, levelLabel, levelIcon }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = (clamped / 100) * CIRC;

  return (
    <div className="dial-card">
      <div className="dial-wrap">
        <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label={`${title}: ${clamped} out of 100, ${levelLabel}`}>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRC - filled}`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="dial-number">{clamped}</div>
      </div>
      <div className="dial-title">{title}</div>
      <span className="level-chip" style={{ ['--chip-color' as string]: color }}>
        <span aria-hidden="true">{levelIcon}</span> {levelLabel}
      </span>
    </div>
  );
}
