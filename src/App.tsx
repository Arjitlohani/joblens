import { useState } from 'react';
import { Analyzer } from './components/Analyzer';
import { ResumeBuilder } from './components/ResumeBuilder';
import { JobSearch } from './components/JobSearch';

type Tab = 'builder' | 'search' | 'check';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'builder', label: 'Resume Builder', icon: '📄' },
  { id: 'search', label: 'Job Search', icon: '🔎' },
  { id: 'check', label: 'Check a Posting', icon: '🛡️' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('builder');
  const [analyzerSeed, setAnalyzerSeed] = useState<string | undefined>(undefined);
  const [seedNonce, setSeedNonce] = useState(0);

  function inspectPosting(text: string) {
    setAnalyzerSeed(text);
    setSeedNonce((n) => n + 1);
    setTab('check');
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="container app-ui">
      <header className="header">
        <h1 className="logo">
          Job<span className="lens">Lens</span>
        </h1>
        <p className="tagline">
          Build an ATS-ready resume, search live listings with built-in scam radar, and X-ray any
          posting before you spend an hour applying to it.
        </p>
        <span className="privacy-badge">
          <span className="dot" aria-hidden="true" /> Privacy-first: your resume and pasted text
          never leave your browser
        </span>
      </header>

      <nav className="tabs" aria-label="JobLens tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab-btn"
            data-active={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {tab === 'builder' && <ResumeBuilder />}
      {tab === 'search' && <JobSearch onInspect={inspectPosting} />}
      {tab === 'check' && (
        <>
          <div className="stats-strip" role="list">
            <div className="stat-tile" role="listitem">
              <div className="big">~1 in 5</div>
              <div>job postings is a “ghost job”</div>
              <div className="why">Greenhouse study, 2025 — many listings have no hire behind them</div>
            </div>
            <div className="stat-tile" role="listitem">
              <div className="big">93%</div>
              <div>of HR pros admit posting ghost jobs</div>
              <div className="why">LiveCareer survey of 918 HR professionals, 2025</div>
            </div>
            <div className="stat-tile" role="listitem">
              <div className="big">+40%</div>
              <div>more likely to reach a human with matched keywords</div>
              <div className="why">Yet 54% of candidates never tailor their resume</div>
            </div>
          </div>
          <Analyzer seed={analyzerSeed} seedNonce={seedNonce} />
        </>
      )}

    </div>
  );
}
