import type { ResumeData } from './types';

/**
 * Assemble the resume as plain text with standard ATS section headings.
 * This is what gets scored, matched against a posting, and downloaded
 * as .txt — the same content the printable preview renders.
 */
export function buildResumeText(r: ResumeData): string {
  const parts: string[] = [];

  const contact = [r.email, r.phone, r.location, r.links].filter(Boolean).join(' | ');
  parts.push([r.fullName, r.headline, contact].filter(Boolean).join('\n'));

  if (r.summary.trim()) {
    parts.push(`PROFESSIONAL SUMMARY\n${r.summary.trim()}`);
  }

  if (r.skillsMode === 'split') {
    if (r.skills.length > 0) parts.push(`TECHNICAL SKILLS\n${r.skills.join(', ')}`);
    if (r.softSkills.length > 0) parts.push(`SOFT SKILLS\n${r.softSkills.join(', ')}`);
  } else if (r.skills.length > 0) {
    parts.push(`SKILLS\n${r.skills.join(', ')}`);
  }

  const exp = r.experience.filter((e) => e.title || e.company);
  if (exp.length > 0) {
    const blocks = exp.map((e) => {
      const head = [e.title, e.company].filter(Boolean).join(' — ');
      const meta = [e.location, [e.start, e.end].filter(Boolean).join(' – ')]
        .filter(Boolean)
        .join(' | ');
      const bullets = e.bullets
        .filter((b) => b.trim())
        .map((b) => `- ${b.trim()}`)
        .join('\n');
      return [head, meta, bullets].filter(Boolean).join('\n');
    });
    parts.push(`WORK EXPERIENCE\n${blocks.join('\n\n')}`);
  }

  const edu = r.education.filter((e) => e.degree || e.school);
  if (edu.length > 0) {
    const blocks = edu.map((e) =>
      [[e.degree, e.school].filter(Boolean).join(' — '), e.year].filter(Boolean).join(', '),
    );
    parts.push(`EDUCATION\n${blocks.join('\n')}`);
  }

  if (r.certifications.length > 0) {
    parts.push(`CERTIFICATIONS & ACHIEVEMENTS\n${r.certifications.join('\n')}`);
  }

  return parts.join('\n\n');
}
