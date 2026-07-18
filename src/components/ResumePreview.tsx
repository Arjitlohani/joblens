import type { ResumeData } from '../resume/types';
import { sidebarInk } from '../resume/color';

interface Props {
  resume: ResumeData;
}

function SkillsBlocks({ resume: r }: Props) {
  if (r.skillsMode === 'split') {
    return (
      <>
        {r.skills.length > 0 && (
          <>
            <h2>Technical Skills</h2>
            <p>{r.skills.join(', ')}</p>
          </>
        )}
        {r.softSkills.length > 0 && (
          <>
            <h2>Soft Skills</h2>
            <p>{r.softSkills.join(', ')}</p>
          </>
        )}
      </>
    );
  }
  return r.skills.length > 0 ? (
    <>
      <h2>Skills</h2>
      <p>{r.skills.join(', ')}</p>
    </>
  ) : null;
}

function ExperienceBlocks({ resume: r }: Props) {
  const exp = r.experience.filter((e) => e.title || e.company);
  if (exp.length === 0) return null;
  return (
    <>
      <h2>Work Experience</h2>
      {exp.map((e) => (
        <div className="rs-role" key={e.id}>
          <p className="rs-role-head">
            <strong>{[e.title, e.company].filter(Boolean).join(' — ')}</strong>
          </p>
          <p className="rs-role-meta">
            {[e.location, [e.start, e.end].filter(Boolean).join(' – ')]
              .filter(Boolean)
              .join('  •  ')}
          </p>
          <ul>
            {e.bullets
              .filter((b) => b.trim())
              .map((b, i) => (
                <li key={i}>{b.trim()}</li>
              ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function CertBlocks({ resume: r }: Props) {
  if (r.certifications.length === 0) return null;
  return (
    <>
      <h2>Certifications & Achievements</h2>
      <ul>
        {r.certifications.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </>
  );
}

function EducationBlocks({ resume: r }: Props) {
  const edu = r.education.filter((e) => e.degree || e.school);
  if (edu.length === 0) return null;
  return (
    <>
      <h2>Education</h2>
      {edu.map((e) => (
        <p key={e.id}>
          <strong>{[e.degree, e.school].filter(Boolean).join(' — ')}</strong>
          {e.year ? `, ${e.year}` : ''}
        </p>
      ))}
    </>
  );
}

/**
 * The printable resume sheet, in two styles:
 *  - 'ats':   single column, no graphics — the parser-first layout.
 *  - 'photo': colorful one-page sidebar layout — photo, contact, education
 *             and skills in a 1/3 side panel; summary, experience and
 *             certifications in the 2/3 main column.
 * This exact element is what "Download as PDF" prints.
 */
export function ResumePreview({ resume: r }: Props) {
  if (r.template === 'photo') {
    const ink = sidebarInk(r.accentColor);
    return (
      <div
        className="resume-sheet"
        data-template="photo"
        id="resume-sheet"
        style={{ ['--rs-accent' as string]: r.accentColor, ['--rs-accent-ink' as string]: ink }}
      >
        <aside className="rs-side">
          {r.photo && <img className="rs-photo" src={r.photo} alt="" />}
          <h1>{r.fullName || 'Your Name'}</h1>
          {r.headline && <p className="rs-headline">{r.headline}</p>}
          <h2>Contact</h2>
          <ul className="rs-contact-list">
            {[r.email, r.phone, r.location, r.links].filter(Boolean).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <EducationBlocks resume={r} />
          <SkillsBlocks resume={r} />
        </aside>
        <div className="rs-main">
          {r.summary.trim() && (
            <>
              <h2>Professional Summary</h2>
              <p>{r.summary.trim()}</p>
            </>
          )}
          <ExperienceBlocks resume={r} />
          <CertBlocks resume={r} />
        </div>
      </div>
    );
  }

  const contact = [r.email, r.phone, r.location, r.links].filter(Boolean).join('  •  ');
  return (
    <div className="resume-sheet" data-template="ats" id="resume-sheet">
      <h1>{r.fullName || 'Your Name'}</h1>
      {r.headline && <p className="rs-headline">{r.headline}</p>}
      {contact && <p className="rs-contact">{contact}</p>}

      {r.summary.trim() && (
        <>
          <h2>Professional Summary</h2>
          <p>{r.summary.trim()}</p>
        </>
      )}

      <SkillsBlocks resume={r} />
      <ExperienceBlocks resume={r} />
      <EducationBlocks resume={r} />
      <CertBlocks resume={r} />
    </div>
  );
}
