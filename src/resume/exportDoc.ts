import type { ResumeData } from './types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Build a Word-compatible .doc file (the HTML-in-Word format, which Word,
 * LibreOffice, and Google Docs all open). Kept single-column with standard
 * headings so the exported document stays ATS-parseable too.
 */
export function buildDocHtml(r: ResumeData): string {
  const contact = [r.email, r.phone, r.location, r.links].filter(Boolean).map(esc).join(' • ');
  const sections: string[] = [];

  const photoBlock =
    r.template === 'photo' && r.photo
      ? `<img src="${r.photo}" width="86" height="86" style="border-radius:6px;float:right;margin-left:12px" alt="" />`
      : '';

  sections.push(
    `${photoBlock}<h1>${esc(r.fullName || 'Your Name')}</h1>` +
      (r.headline ? `<p class="headline">${esc(r.headline)}</p>` : '') +
      (contact ? `<p class="contact">${contact}</p>` : ''),
  );

  if (r.summary.trim()) {
    sections.push(`<h2>Professional Summary</h2><p>${esc(r.summary.trim())}</p>`);
  }

  if (r.skillsMode === 'split') {
    if (r.skills.length > 0)
      sections.push(`<h2>Technical Skills</h2><p>${esc(r.skills.join(', '))}</p>`);
    if (r.softSkills.length > 0)
      sections.push(`<h2>Soft Skills</h2><p>${esc(r.softSkills.join(', '))}</p>`);
  } else if (r.skills.length > 0) {
    sections.push(`<h2>Skills</h2><p>${esc(r.skills.join(', '))}</p>`);
  }

  const exp = r.experience.filter((e) => e.title || e.company);
  if (exp.length > 0) {
    const blocks = exp
      .map((e) => {
        const head = esc([e.title, e.company].filter(Boolean).join(' — '));
        const meta = esc(
          [e.location, [e.start, e.end].filter(Boolean).join(' – ')].filter(Boolean).join(' • '),
        );
        const bullets = e.bullets
          .filter((b) => b.trim())
          .map((b) => `<li>${esc(b.trim())}</li>`)
          .join('');
        return `<p><b>${head}</b><br/><span class="meta">${meta}</span></p><ul>${bullets}</ul>`;
      })
      .join('');
    sections.push(`<h2>Work Experience</h2>${blocks}`);
  }

  const edu = r.education.filter((e) => e.degree || e.school);
  if (edu.length > 0) {
    const blocks = edu
      .map(
        (e) =>
          `<p><b>${esc([e.degree, e.school].filter(Boolean).join(' — '))}</b>${
            e.year ? `, ${esc(e.year)}` : ''
          }</p>`,
      )
      .join('');
    sections.push(`<h2>Education</h2>${blocks}`);
  }

  if (r.certifications.length > 0) {
    sections.push(
      `<h2>Certifications &amp; Achievements</h2><ul>${r.certifications
        .map((c) => `<li>${esc(c)}</li>`)
        .join('')}</ul>`,
    );
  }

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${esc(r.fullName || 'Resume')}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; line-height: 1.4; }
  h1 { font-size: 20pt; margin: 0; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 14pt 0 4pt; }
  p { margin: 3pt 0; }
  ul { margin: 3pt 0; padding-left: 18pt; }
  .headline { font-size: 12pt; color: #333; }
  .contact, .meta { color: #555; font-size: 10pt; }
</style></head>
<body>${sections.join('')}</body></html>`;
}

/** Trigger a browser download of the resume as a Word-compatible .doc. */
export function downloadDoc(r: ResumeData): void {
  const blob = new Blob([buildDocHtml(r)], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(r.fullName || 'resume').replace(/\s+/g, '-')}-resume.doc`;
  a.click();
  URL.revokeObjectURL(a.href);
}
