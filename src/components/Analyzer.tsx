import { useEffect, useMemo, useState } from 'react';
import type { Analysis, PostingAge, Verdict } from '../engine/types';
import { analyze } from '../engine/analyze';
import { decodeBuzzwords } from '../engine/buzzwords';
import { ScoreDial } from './ScoreDial';
import { FindingsList, SEVERITY_COLOR } from './FindingsList';
import { RequirementsPanel } from './RequirementsPanel';
import { GENUINE_POSTING, GHOST_POSTING, SCAM_POSTING } from '../examples';

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

/**
 * Public CORS pass-throughs used only to fetch the posting URL the user gives
 * us (tried in order — these free proxies come and go).
 */
const PROXIES = [
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function fetchPostingText(url: string): Promise<string> {
  let lastError: unknown = new Error('no proxy available');
  for (const makeProxyUrl of PROXIES) {
    try {
      const res = await fetch(makeProxyUrl(url), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc
        .querySelectorAll('script,style,noscript,nav,footer,header,iframe')
        .forEach((n) => n.remove());
      const text = (doc.body.textContent ?? '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .trim();
      if (text.length < 200) {
        throw new Error('too little text — the page is probably rendered with JavaScript');
      }
      return text;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

interface Props {
  /** Posting text handed over from the Job Search tab. */
  seed?: string;
  /** Bumped each time a new seed is handed over, even if the text repeats. */
  seedNonce?: number;
}

export function Analyzer({ seed, seedNonce }: Props) {
  const [jobText, setJobText] = useState('');
  const [url, setUrl] = useState('');
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'failed'>('idle');
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
    setAnalysis(analyze({ jobText, postingAge }));
  }

  async function fetchUrl() {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) return;
    setFetchState('loading');
    try {
      const text = await fetchPostingText(u);
      setJobText(text);
      setAnalysis(analyze({ jobText: text, postingAge }));
      setFetchState('idle');
    } catch {
      setFetchState('failed');
    }
  }

  function loadExample(job: string) {
    setJobText(job);
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
        <label className="field-label" htmlFor="joburl">
          Check a job posting
          <span className="field-hint">paste a link, or paste the posting text below</span>
        </label>
        <div className="controls-row" style={{ marginTop: 4 }}>
          <input
            id="joburl"
            className="search-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUrl()}
            placeholder="https://… link to the job posting"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchUrl}
            disabled={fetchState === 'loading' || !/^https?:\/\//i.test(url.trim())}
          >
            {fetchState === 'loading' ? 'Fetching…' : 'Fetch & check'}
          </button>
        </div>
        {fetchState === 'failed' && (
          <p className="section-sub" style={{ marginTop: 8, color: 'var(--serious)' }}>
            Couldn't read that page (many job sites block automated fetching or render with
            JavaScript). Copy the posting text and paste it below instead.
          </p>
        )}

        <div style={{ marginTop: 16 }}>
          <textarea
            id="jd"
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="…or copy-paste the job posting here — title, description, requirements, all of it"
            aria-label="Job posting text"
          />
        </div>

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
          <button type="button" className="btn btn-primary" onClick={run} disabled={!canAnalyze}>
            Check it
          </button>
          {!canAnalyze && jobText.trim().length > 0 && (
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
              Paste a bit more of the posting first.
            </span>
          )}
        </div>

        <div className="examples-row">
          Try an example:
          <button type="button" className="btn btn-ghost" onClick={() => loadExample(GENUINE_POSTING)}>
            Genuine posting
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadExample(GHOST_POSTING)}>
            Ghost job
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadExample(SCAM_POSTING)}>
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
        </div>
      )}
    </>
  );
}
