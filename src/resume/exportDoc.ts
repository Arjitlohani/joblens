import type { ResumeData } from './types';
import { sidebarInk } from './color';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function summaryBlock(r: ResumeData): string {
  return r.summary.trim() ? `<h2>Professional Summary</h2><p>${esc(r.summary.trim())}</p>` : '';
}

function skillsBlock(r: ResumeData): string {
  if (r.skillsMode === 'split') {
    return (
      (r.skills.length > 0 ? `<h2>Technical Skills</h2><p>${esc(r.skills.join(', '))}</p>` : '') +
      (r.softSkills.length > 0
        ? `<h2>Soft Skills</h2><p>${esc(r.softSkills.join(', '))}</p>`
        : '')
    );
  }
  return r.skills.length > 0 ? `<h2>Skills</h2><p>${esc(r.skills.join(', '))}</p>` : '';
}

function experienceBlock(r: ResumeData): string {
  const exp = r.experience.filter((e) => e.title || e.company);
  if (exp.length === 0) return '';
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
  return `<h2>Work Experience</h2>${blocks}`;
}

function educationBlock(r: ResumeData): string {
  const edu = r.education.filter((e) => e.degree || e.school);
  if (edu.length === 0) return '';
  const blocks = edu
    .map(
      (e) =>
        `<p><b>${esc([e.degree, e.school].filter(Boolean).join(' — '))}</b>${
          e.year ? `, ${esc(e.year)}` : ''
        }</p>`,
    )
    .join('');
  return `<h2>Education</h2>${blocks}`;
}

function certsBlock(r: ResumeData): string {
  if (r.certifications.length === 0) return '';
  return `<h2>Certifications &amp; Achievements</h2><ul>${r.certifications
    .map((c) => `<li>${esc(c)}</li>`)
    .join('')}</ul>`;
}

function docShell(title: string, extraCss: string, body: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; line-height: 1.4; }
  h1 { font-size: 20pt; margin: 0; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 14pt 0 4pt; }
  p { margin: 3pt 0; }
  ul { margin: 3pt 0; padding-left: 18pt; }
  .headline { font-size: 12pt; color: #333; }
  .contact, .meta { color: #555; font-size: 10pt; }
  ${extraCss}
</style></head>
<body>${body}</body></html>`;
}

/**
 * Build a Word-compatible .doc file (the HTML-in-Word format, which Word,
 * LibreOffice, and Google Docs all open).
 *
 * 'ats' template: single column, standard headings — stays ATS-parseable.
 * 'photo' template: a 1/3 + 2/3 two-column table; the colored sidebar holds
 * photo, name, contact, education and skills, matching the on-screen preview.
 */
export function buildDocHtml(r: ResumeData): string {
  const title = r.fullName || 'Resume';

  if (r.template === 'photo') {
    const accent = r.accentColor || '#2c4a63';
    const ink = sidebarInk(accent);
    const photoBlock = r.photo
      ? `<p align="center"><img src="${r.photo}" width="110" height="110" alt="" /></p>`
      : '';
    const contactItems = [r.email, r.phone, r.location, r.links]
      .filter(Boolean)
      .map((c) => `<p class="side-item">${esc(c)}</p>`)
      .join('');
    const side =
      photoBlock +
      `<h1 class="side-name">${esc(r.fullName || 'Your Name')}</h1>` +
      (r.headline ? `<p class="side-headline">${esc(r.headline)}</p>` : '') +
      `<h2 class="side-h">Contact</h2>${contactItems}` +
      educationBlock(r).replace(/<h2>/g, '<h2 class="side-h">') +
      skillsBlock(r).replace(/<h2>/g, '<h2 class="side-h">');
    const main = summaryBlock(r) + experienceBlock(r) + certsBlock(r);
    const extraCss = `
  table.layout { border-collapse: collapse; width: 100%; }
  td.side { background: ${accent}; color: ${ink}; width: 33%; padding: 16pt 12pt; vertical-align: top; }
  td.side p, td.side h1, td.side h2, td.side li { color: ${ink}; }
  td.main { width: 67%; padding: 16pt 14pt; vertical-align: top; }
  td.main h2 { color: ${accent}; border-bottom-color: ${accent}; }
  .side-name { font-size: 16pt; }
  .side-headline { font-size: 11pt; }
  .side-item { font-size: 9.5pt; }
  h2.side-h { border-bottom-color: ${ink}; }`;
    const body = `<table class="layout"><tr><td class="side">${side}</td><td class="main">${main}</td></tr></table>`;
    return docShell(title, extraCss, body);
  }

  const contact = [r.email, r.phone, r.location, r.links].filter(Boolean).map(esc).join(' • ');
  const body =
    `<h1>${esc(r.fullName || 'Your Name')}</h1>` +
    (r.headline ? `<p class="headline">${esc(r.headline)}</p>` : '') +
    (contact ? `<p class="contact">${contact}</p>` : '') +
    summaryBlock(r) +
    skillsBlock(r) +
    experienceBlock(r) +
    educationBlock(r) +
    certsBlock(r);
  return docShell(title, '', body);
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
