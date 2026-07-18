import { useEffect, useMemo, useState } from 'react';
import { emptyResume, type EducationEntry, type ExperienceEntry, type ResumeData } from '../resume/types';
import { atsCheck } from '../resume/atsCheck';
import { buildResumeText } from '../resume/buildText';
import { ScoreDial } from './ScoreDial';
import { ResumePreview } from './ResumePreview';

const STORAGE_KEY = 'joblens.resume.v1';

function loadSaved(): ResumeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyResume(), ...(JSON.parse(raw) as ResumeData) };
  } catch {
    // Corrupt or unavailable storage — start fresh.
  }
  return emptyResume();
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--good)';
  if (score >= 55) return 'var(--warning)';
  return 'var(--serious)';
}

export function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeData>(loadSaved);
  const [skillsRaw, setSkillsRaw] = useState(() => loadSaved().skills.join(', '));
  const [certsRaw, setCertsRaw] = useState(() => loadSaved().certifications.join('\n'));
  const [targetJd, setTargetJd] = useState('');
  const [showTarget, setShowTarget] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    } catch {
      // Storage full or blocked — the builder still works, just without persistence.
    }
  }, [resume]);

  const score = useMemo(
    () => atsCheck(resume, showTarget ? targetJd : undefined),
    [resume, targetJd, showTarget],
  );

  function set<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    setResume((r) => ({ ...r, [key]: value }));
  }

  function setSkills(raw: string) {
    setSkillsRaw(raw);
    set(
      'skills',
      raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  function setCerts(raw: string) {
    setCertsRaw(raw);
    set(
      'certifications',
      raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    set(
      'experience',
      resume.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }

  function updateEducation(id: string, patch: Partial<EducationEntry>) {
    set(
      'education',
      resume.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }

  function downloadTxt() {
    const blob = new Blob([buildResumeText(resume)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(resume.fullName || 'resume').replace(/\s+/g, '-')}-resume.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="builder-grid">
      <div>
        <div className="input-card">
          <h3 style={{ marginTop: 0 }}>Contact</h3>
          <div className="form-grid">
            <input placeholder="Full name" value={resume.fullName} onChange={(e) => set('fullName', e.target.value)} aria-label="Full name" />
            <input placeholder="Headline, e.g. Frontend Developer" value={resume.headline} onChange={(e) => set('headline', e.target.value)} aria-label="Headline" />
            <input placeholder="Email" type="email" value={resume.email} onChange={(e) => set('email', e.target.value)} aria-label="Email" />
            <input placeholder="Phone" value={resume.phone} onChange={(e) => set('phone', e.target.value)} aria-label="Phone" />
            <input placeholder="City, Country" value={resume.location} onChange={(e) => set('location', e.target.value)} aria-label="Location" />
            <input placeholder="LinkedIn / portfolio URL (optional)" value={resume.links} onChange={(e) => set('links', e.target.value)} aria-label="Links" />
          </div>
        </div>

        <div className="input-card">
          <h3 style={{ marginTop: 0 }}>Professional summary</h3>
          <textarea
            className="resume-box"
            value={resume.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="2–4 sentences: who you are, your strongest skills, one concrete achievement with a number…"
          />
        </div>

        <div className="input-card">
          <h3 style={{ marginTop: 0 }}>
            Skills <span className="field-hint">comma-separated — this is the #1 ATS keyword zone</span>
          </h3>
          <textarea
            className="resume-box"
            style={{ minHeight: 70 }}
            value={skillsRaw}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="JavaScript, React, Customer service, POS systems, …"
          />
        </div>

        <div className="input-card">
          <h3 style={{ marginTop: 0 }}>Work experience</h3>
          {resume.experience.map((e, idx) => (
            <div className="exp-block" key={e.id}>
              <div className="exp-head">
                <strong>Role {idx + 1}</strong>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => set('experience', resume.experience.filter((x) => x.id !== e.id))}
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <input placeholder="Job title" value={e.title} onChange={(ev) => updateExperience(e.id, { title: ev.target.value })} aria-label={`Role ${idx + 1} title`} />
                <input placeholder="Company" value={e.company} onChange={(ev) => updateExperience(e.id, { company: ev.target.value })} aria-label={`Role ${idx + 1} company`} />
                <input placeholder="Location" value={e.location} onChange={(ev) => updateExperience(e.id, { location: ev.target.value })} aria-label={`Role ${idx + 1} location`} />
                <div className="form-grid two" style={{ gap: 8 }}>
                  <input placeholder="Start (e.g. Jun 2023)" value={e.start} onChange={(ev) => updateExperience(e.id, { start: ev.target.value })} aria-label={`Role ${idx + 1} start date`} />
                  <input placeholder="End (or Present)" value={e.end} onChange={(ev) => updateExperience(e.id, { end: ev.target.value })} aria-label={`Role ${idx + 1} end date`} />
                </div>
              </div>
              <textarea
                className="resume-box"
                style={{ marginTop: 10 }}
                value={e.bullets.join('\n')}
                onChange={(ev) => updateExperience(e.id, { bullets: ev.target.value.split('\n') })}
                placeholder={'One bullet per line. Start with a verb, add a number:\nServed 200+ covers a night in a 12-table section\nReduced order errors 15% by introducing a double-check step'}
                aria-label={`Role ${idx + 1} bullet points`}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              set('experience', [
                ...resume.experience,
                { id: newId(), title: '', company: '', location: '', start: '', end: '', bullets: [] },
              ])
            }
          >
            + Add role
          </button>
        </div>

        <div className="input-card">
          <h3 style={{ marginTop: 0 }}>Education & certifications</h3>
          {resume.education.map((e, idx) => (
            <div className="form-grid three" key={e.id} style={{ marginBottom: 8 }}>
              <input placeholder="Degree / qualification" value={e.degree} onChange={(ev) => updateEducation(e.id, { degree: ev.target.value })} aria-label={`Education ${idx + 1} degree`} />
              <input placeholder="School" value={e.school} onChange={(ev) => updateEducation(e.id, { school: ev.target.value })} aria-label={`Education ${idx + 1} school`} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Year" value={e.year} onChange={(ev) => updateEducation(e.id, { year: ev.target.value })} aria-label={`Education ${idx + 1} year`} />
                <button type="button" className="btn btn-ghost" onClick={() => set('education', resume.education.filter((x) => x.id !== e.id))}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => set('education', [...resume.education, { id: newId(), degree: '', school: '', year: '' }])}
          >
            + Add education
          </button>
          <textarea
            className="resume-box"
            style={{ minHeight: 60, marginTop: 12 }}
            value={certsRaw}
            onChange={(e) => setCerts(e.target.value)}
            placeholder={'Certifications, one per line (RSA, First Aid, AWS Cloud Practitioner…)'}
            aria-label="Certifications"
          />
        </div>

        <div className="input-card">
          <button type="button" className="btn btn-ghost" onClick={() => setShowTarget((s) => !s)}>
            {showTarget ? '− Hide target job' : '🎯 Target a specific job posting'}
          </button>
          {showTarget && (
            <textarea
              className="resume-box"
              style={{ marginTop: 12 }}
              value={targetJd}
              onChange={(e) => setTargetJd(e.target.value)}
              placeholder="Paste the posting you're applying to — your score will include keyword coverage against it."
              aria-label="Target job posting"
            />
          )}
        </div>
      </div>

      <div className="builder-side">
        <div className="dial-card">
          <ScoreDial
            title="ATS readiness"
            value={score.score}
            color={scoreColor(score.score)}
            levelLabel={score.score >= 80 ? 'Interview-ready' : score.score >= 55 ? 'Getting there' : 'Keep going'}
            levelIcon={score.score >= 80 ? '✓' : '△'}
          />
          {score.keywordCoverage !== undefined && (
            <p style={{ color: 'var(--ink-2)', fontSize: '0.85rem', marginTop: 10 }}>
              includes {score.keywordCoverage}% keyword coverage of the target posting
            </p>
          )}
        </div>

        <div className="section" style={{ marginTop: 14 }}>
          <h3>Score checklist</h3>
          {score.items.map((i) => (
            <div className="check-item" key={i.id} data-passed={i.passed}>
              <span className="check-mark" aria-hidden="true">{i.passed ? '✓' : '○'}</span>
              <div>
                <div className="check-label">
                  {i.label} <span className="check-pts">{i.earned}/{i.available}</span>
                </div>
                {!i.passed && <div className="check-tip">{i.tip}</div>}
              </div>
            </div>
          ))}
          {score.missingKeywords.length > 0 && (
            <div className="match-advice" style={{ marginTop: 14 }}>
              <strong>Target posting keywords you're missing:</strong>{' '}
              {score.missingKeywords.join(', ')}. Add the ones you genuinely have — using the
              posting's exact wording.
            </div>
          )}
        </div>

        <div className="section" style={{ marginTop: 14 }}>
          <h3>Download</h3>
          <p className="section-sub">
            PDF opens your browser's print dialog — choose “Save as PDF”. The layout is
            single-column and graphics-free on purpose: that's the format ATS parsers read best.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              Download as PDF
            </button>
            <button type="button" className="btn btn-ghost" onClick={downloadTxt}>
              Download .txt
            </button>
          </div>
        </div>
      </div>

      <div className="preview-wrap">
        <h3 style={{ margin: '6px 0 10px' }}>Live preview</h3>
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}
