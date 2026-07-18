import { useEffect, useMemo, useState } from 'react';
import type { Analysis, PostingAge, Verdict } from '../engine/types';
import { analyze } from '../engine/analyze';
import { decodeBuzzwords } from '../engine/buzzwords';
import { ScoreDial } from './ScoreDial';
import { FindingsList, SEVERITY_COLOR } from './FindingsList';
import { MatchPanel } from './MatchPanel';
import { RequirementsPanel } from './RequirementsPanel';
import { GENUINE_POSTING, GHOST_POSTING, SCAM_POSTING, SAMPLE_RESUME } from '../examples';

const VERDICT_META: Record<Verdict, { icon: string; title: string; color: string }> = {
  apply: { icon: '✅', title: 'Worth applying', color: 'var(--good)' },
  caution: { icon: '⚠️', title: 'Apply with caution', color: 'var(--warning)' },
  skip: { icon: '👻', title: 'Likely ghost job — low priority', color: 'var(--serious)' },
  scam: { icon: '🛑', title: 'Scam warning — do not apply', color: 'var(--critical)' },
};

const GHOST_LEVEL = {
  low: { label: 'Low risk', icon: '✓', color: 'var(--good)' },
  moderate: { label: 'Moderate risk', icon: '△', color: 'var(--warning)' },
  high: { label: 'High risk', icon: '▲', color: 'var(--serious)' },
} as const;

const SCAM_LEVEL = {
  clear: { label: 'No signals', icon: '✓', color: 'var(--good)' },
  suspicious: { label: 'Suspicious', icon: '△', color: 'var(--warning)' },
  danger: { label: 'Danger', icon: '✕', color: 'var(--critical)' },
} as const;

interface Props {
  /** Posting text handed over from the Job Search tab. */
  seed?: string;
  /** Bumped each time a new seed is handed over, even if the text repeats. */
  seedNonce?: number;
}

export function Analyzer({ seed, seedNonce }: Props) {
  const [jobText, setJobText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [postingAge, setPostingAge] = useState<PostingAge>('unknown');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (seed && seed.trim().length >= 40) {
      setJobText(seed);
      setPostingAge('unknown');
      setAnalysis(analyze({ jobText: seed, postingAge: 'unknown' }));
    }
  }, [seed, seedNonce]);

  const canAnalyze = jobText.trim().length >= 40;

  function run() {
    if (!canAnalyze) return;
    setAnalysis(analyze({ jobText, resumeText: showResume ? resumeText : undefined, postingAge }));
  }

  function loadExample(job: string, withResume: boolean) {
    setJobText(job);
    if (withResume) {
      setShowResume(true);
      setResumeText(SAMPLE_RESUME);
    }
    setAnalysis(null);
  }

  const buzzwords = useMemo(
    () => (analysis ? decodeBuzzwords(jobText) : []),
    [analysis, jobText],
  );

  const verdictMeta = analysis ? VERDICT_META[analysis.verdict] : null;

  return (
    <>
      <div className="input-card">
        <label className="field-label" htmlFor="jd">
          Paste the job posting
          <span className="field-hint">the whole thing — title, description, requirements</span>
        </label>
        <textarea
          id="jd"
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="Paste the full job posting here…"
        />

        <div className="controls-row">
          <label htmlFor="age" style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
            When was it posted?
          </label>
          <select
            id="age"
            value={postingAge}
            onChange={(e) => setPostingAge(e.target.value as PostingAge)}
          >
            <option value="unknown">Not sure</option>
            <option value="under1w">Within the last week</option>
            <option value="1to4w">1–4 weeks ago</option>
            <option value="1to3m">1–3 months ago</option>
            <option value="over3m">More than 3 months ago</option>
          </select>

          <button type="button" className="btn btn-ghost" onClick={() => setShowResume((s) => !s)}>
            {showResume ? '− Hide resume' : '+ Add your resume for an ATS match'}
          </button>
        </div>

        {showResume && (
          <div style={{ marginTop: 16 }}>
            <label className="field-label" htmlFor="resume">
              Paste your resume
              <span className="field-hint">plain text is fine — it never leaves this page</span>
            </label>
            <textarea
              id="resume"
              className="resume-box"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here…"
            />
          </div>
        )}

        <div className="controls-row">
          <button type="button" className="btn btn-primary" onClick={run} disabled={!canAnalyze}>
            Analyze this posting
          </button>
          {!canAnalyze && jobText.trim().length > 0 && (
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
              Paste a bit more of the posting first.
            </span>
          )}
        </div>

        <div className="examples-row">
          Try an example:
          <button type="button" className="btn btn-ghost" onClick={() => loadExample(GENUINE_POSTING, true)}>
            Genuine posting
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadExample(GHOST_POSTING, false)}>
            Ghost job
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadExample(SCAM_POSTING, false)}>
            Scam
          </button>
        </div>
      </div>

      {analysis && verdictMeta && (
        <div id="results">
          <div className="verdict" style={{ ['--v-color' as string]: verdictMeta.color }}>
            <span className="v-icon" aria-hidden="true">
              {verdictMeta.icon}
            </span>
            <div>
              <h2>{verdictMeta.title}</h2>
              <p>{analysis.verdictReason}</p>
            </div>
          </div>

          <div className="dials">
            <ScoreDial
              title="Ghost-job risk"
              value={analysis.ghost.score}
              color={GHOST_LEVEL[analysis.ghost.level].color}
              levelLabel={GHOST_LEVEL[analysis.ghost.level].label}
              levelIcon={GHOST_LEVEL[analysis.ghost.level].icon}
            />
            <ScoreDial
              title="Scam signals"
              value={analysis.scam.score}
              color={SCAM_LEVEL[analysis.scam.level].color}
              levelLabel={SCAM_LEVEL[analysis.scam.level].label}
              levelIcon={SCAM_LEVEL[analysis.scam.level].icon}
            />
            {analysis.match && analysis.match.totalKeywords > 0 && (
              <ScoreDial
                title="Resume match"
                value={analysis.match.score}
                color={
                  analysis.match.score >= 60
                    ? 'var(--good)'
                    : analysis.match.score >= 35
                      ? 'var(--warning)'
                      : 'var(--serious)'
                }
                levelLabel={
                  analysis.match.score >= 60
                    ? 'Strong coverage'
                    : analysis.match.score >= 35
                      ? 'Needs tailoring'
                      : 'Big gaps'
                }
                levelIcon={analysis.match.score >= 60 ? '✓' : '△'}
              />
            )}
          </div>

          {analysis.scam.findings.length > 0 && (
            <div className="section">
              <h3>Scam signals</h3>
              <p className="section-sub">
                Patterns drawn from FTC consumer alerts on employment scams.
              </p>
              <FindingsList findings={analysis.scam.findings} emptyMessage="" />
            </div>
          )}

          <div className="section">
            <h3>Ghost-job signals</h3>
            <p className="section-sub">
              Is anyone actually being hired for this role? Signals from 2025–26 hiring-market
              research.
            </p>
            <FindingsList
              findings={analysis.ghost.findings}
              emptyMessage="No ghost-job signals — this reads like a real, budgeted role."
            />
            {!analysis.salary.disclosed || analysis.verdict === 'scam' ? null : (
              <p className="finding-detail" style={{ marginTop: 12 }}>
                <span className="sev" style={{ ['--sev-color' as string]: SEVERITY_COLOR.positive, marginRight: 8 }}>
                  good sign
                </span>
                Salary disclosed: {analysis.salary.text}
              </p>
            )}
          </div>

          {buzzwords.length > 0 && (
            <div className="section">
              <h3>Buzzword decoder</h3>
              <p className="section-sub">What the posting says vs. what it usually means.</p>
              {buzzwords.map((b) => (
                <div className="buzz-row" key={b.phrase}>
                  <span className="buzz-phrase">“{b.phrase}”</span>
                  <span className="buzz-translation">{b.translation}</span>
                </div>
              ))}
            </div>
          )}

          <RequirementsPanel requirements={analysis.requirements} />

          {analysis.match &&
            (analysis.match.totalKeywords > 0 ? (
              <MatchPanel match={analysis.match} />
            ) : (
              <div className="section">
                <h3>ATS resume match</h3>
                <p className="section-sub">
                  This posting doesn't name any recognizable skills to match against — which is
                  itself a sign of a vague, copy-paste description.
                </p>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
