import { useMemo, useState } from 'react';
import { searchJobs, type JobListing } from '../jobsearch/api';
import { analyze } from '../engine/analyze';
import type { Analysis } from '../engine/types';

interface Props {
  /** Hand a listing's text to the "Check a posting" tab for a full report. */
  onInspect: (postingText: string) => void;
}

const BADGE = {
  apply: { text: 'Looks clean', color: 'var(--good)', icon: '✓' },
  caution: { text: 'Some flags', color: 'var(--warning)', icon: '△' },
  skip: { text: 'Ghost-job signals', color: 'var(--serious)', icon: '👻' },
  scam: { text: 'Scam signals', color: 'var(--critical)', icon: '🛑' },
} as const;

function ListingCard({ job, onInspect }: { job: JobListing; onInspect: Props['onInspect'] }) {
  const scan: Analysis = useMemo(
    () => analyze({ jobText: `${job.title}\n${job.description}` }),
    [job],
  );
  const badge = BADGE[scan.verdict];
  const flagCount = scan.ghost.findings.length + scan.scam.findings.length;

  return (
    <div className="job-card">
      <div className="job-card-head">
        <div>
          <div className="job-title">{job.title}</div>
          <div className="job-meta">
            {job.company} · {job.location}
            {job.salary ? ` · ${job.salary}` : ''}
            {job.postedAt ? ` · posted ${job.postedAt}` : ''} · via {job.source}
          </div>
        </div>
        <span className="level-chip" style={{ ['--chip-color' as string]: badge.color }}>
          <span aria-hidden="true">{badge.icon}</span> {badge.text}
        </span>
      </div>
      <p className="job-snippet">{job.description.slice(0, 220)}…</p>
      <div className="controls-row" style={{ marginTop: 10 }}>
        <a className="btn btn-ghost" href={job.url} target="_blank" rel="noopener noreferrer">
          View posting ↗
        </a>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onInspect(`${job.title} — ${job.company}\n\n${job.description}`)}
        >
          Full JobLens report ({flagCount} {flagCount === 1 ? 'flag' : 'flags'}) →
        </button>
      </div>
    </div>
  );
}

export function JobSearch({ onInspect }: Props) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [failedSources, setFailedSources] = useState<string[]>([]);

  async function run() {
    setStatus('loading');
    try {
      const outcome = await searchJobs(query, location);
      setJobs(outcome.jobs);
      setFailedSources(outcome.failedSources);
      setStatus(outcome.jobs.length === 0 && outcome.failedSources.length === 3 ? 'error' : 'done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <div className="input-card">
        <label className="field-label" htmlFor="jobquery">
          What & where
          <span className="field-hint">
            every result is auto-scanned for ghost-job and scam signals before you click
          </span>
        </label>
        <div className="controls-row" style={{ marginTop: 4 }}>
          <input
            id="jobquery"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="Keyword: frontend developer, customer support, barista…"
          />
          <input
            id="joblocation"
            className="search-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="Location: Sydney, Germany, USA, remote…"
            aria-label="Location"
          />
          <button type="button" className="btn btn-primary" onClick={run} disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="section-sub" style={{ marginTop: 10, marginBottom: 0 }}>
          Sources: free public feeds (Remotive, Arbeitnow, Jobicy) — strongest for remote and
          tech/EU roles. Roles marked “Worldwide/Anywhere” match any location you type. Only the
          keyword is sent to the feeds; location filtering happens on your device.
        </p>
      </div>

      {status === 'error' && (
        <div className="section">
          <h3>Couldn't reach the job feeds</h3>
          <p className="section-sub">
            Both sources failed — this is usually a network issue or the feeds being temporarily
            down. Try again in a minute.
          </p>
        </div>
      )}

      {status === 'done' && (
        <>
          {failedSources.length > 0 && (
            <p className="section-sub">
              Note: {failedSources.join(' and ')} couldn't be reached — showing partial results.
            </p>
          )}
          <p className="section-sub">
            {jobs.length} listings, newest first — each badge is a live scan, not a label from the
            job board.
          </p>
          {jobs.map((j) => (
            <ListingCard key={j.id} job={j} onInspect={onInspect} />
          ))}
          {jobs.length === 0 && (
            <div className="section">
              <h3>No matches</h3>
              <p className="section-sub">
                Try a broader keyword ("support", "developer", "marketing"), a country instead of
                a city, or leave location empty — these free feeds skew remote/tech, so city-level
                filters can come up empty even when jobs exist elsewhere.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
