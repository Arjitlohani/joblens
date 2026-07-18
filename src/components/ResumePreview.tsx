import type { ResumeData } from '../resume/types';

interface Props {
  resume: ResumeData;
}

/**
 * The printable resume sheet. Deliberately boring: single column, black on
 * white, standard headings, no tables or graphics — the format that parses
 * cleanly in every ATS. This exact element is what "Download as PDF" prints.
 */
export function ResumePreview({ resume: r }: Props) {
  const contact = [r.email, r.phone, r.location, r.links].filter(Boolean).join('  •  ');
  const exp = r.experience.filter((e) => e.title || e.company);
  const edu = r.education.filter((e) => e.degree || e.school);

  return (
    <div className="resume-sheet" id="resume-sheet">
      <h1>{r.fullName || 'Your Name'}</h1>
      {r.headline && <p className="rs-headline">{r.headline}</p>}
      {contact && <p className="rs-contact">{contact}</p>}

      {r.summary.trim() && (
        <>
          <h2>Professional Summary</h2>
          <p>{r.summary.trim()}</p>
        </>
      )}

      {r.skills.length > 0 && (
        <>
          <h2>Skills</h2>
          <p>{r.skills.join(', ')}</p>
        </>
      )}

      {exp.length > 0 && (
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
      )}

      {edu.length > 0 && (
        <>
          <h2>Education</h2>
          {edu.map((e) => (
            <p key={e.id}>
              <strong>{[e.degree, e.school].filter(Boolean).join(' — ')}</strong>
              {e.year ? `, ${e.year}` : ''}
            </p>
          ))}
        </>
      )}

      {r.certifications.length > 0 && (
        <>
          <h2>Certifications</h2>
          <ul>
            {r.certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
