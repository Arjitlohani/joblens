import { describe, expect, it } from 'vitest';
import { buildResumeText } from '../buildText';
import { buildDocHtml } from '../exportDoc';
import { atsCheck } from '../atsCheck';
import { emptyResume, type ResumeData } from '../types';

function strongResume(): ResumeData {
  return {
    fullName: 'Sam Candidate',
    email: 'sam@example.com',
    phone: '+1 555 010 1234',
    location: 'Denver, CO',
    links: 'linkedin.com/in/samcandidate',
    headline: 'Frontend Developer',
    summary:
      'Frontend developer with 3 years of experience building accessible React applications. Shipped customer-facing features used by 40,000 monthly users and cut page load times by 45%.',
    skillsMode: 'combined' as const,
    skills: ['JavaScript', 'TypeScript', 'React', 'CSS', 'Git', 'REST APIs', 'Jest'],
    softSkills: [],
    template: 'ats' as const,
    photo: undefined,
    accentColor: '#2c4a63',
    experience: [
      {
        id: 'e1',
        title: 'Frontend Developer',
        company: 'Acme Corp',
        location: 'Remote',
        start: 'Jun 2023',
        end: 'Present',
        bullets: [
          'Built a React component library adopted by 4 product teams',
          'Reduced bundle size 35% by code-splitting and dependency audits',
          'Led migration of 120 screens from JavaScript to TypeScript',
        ],
      },
    ],
    education: [{ id: 'ed1', degree: 'BSc Computer Science', school: 'State University', year: '2022' }],
    certifications: ['AWS Cloud Practitioner'],
  };
}

describe('buildResumeText', () => {
  it('assembles standard ATS headings in order', () => {
    const text = buildResumeText(strongResume());
    const idx = (h: string) => text.indexOf(h);
    expect(idx('PROFESSIONAL SUMMARY')).toBeGreaterThan(-1);
    expect(idx('SKILLS')).toBeGreaterThan(idx('PROFESSIONAL SUMMARY'));
    expect(idx('WORK EXPERIENCE')).toBeGreaterThan(idx('SKILLS'));
    expect(idx('EDUCATION')).toBeGreaterThan(idx('WORK EXPERIENCE'));
    expect(idx('CERTIFICATIONS')).toBeGreaterThan(idx('EDUCATION'));
  });

  it('omits empty sections', () => {
    const text = buildResumeText(emptyResume());
    expect(text).not.toContain('WORK EXPERIENCE');
    expect(text).not.toContain('SKILLS');
  });

  it('renders bullets with dashes', () => {
    const text = buildResumeText(strongResume());
    expect(text).toContain('- Built a React component library');
  });

  it('splits hard and soft skills when skillsMode is split', () => {
    const r = strongResume();
    r.skillsMode = 'split';
    r.softSkills = ['Communication', 'Teamwork'];
    const text = buildResumeText(r);
    expect(text).toContain('TECHNICAL SKILLS\nJavaScript');
    expect(text).toContain('SOFT SKILLS\nCommunication, Teamwork');
    expect(text).not.toContain('SKILLS\nJavaScript, TypeScript, React, CSS, Git, REST APIs, Jest\n\nWORK');
  });

  it('titles the combined certifications section', () => {
    const text = buildResumeText(strongResume());
    expect(text).toContain('CERTIFICATIONS & ACHIEVEMENTS');
  });
});

describe('buildDocHtml', () => {
  it('produces Word-compatible HTML with all sections', () => {
    const html = buildDocHtml(strongResume());
    expect(html).toContain('urn:schemas-microsoft-com:office:word');
    expect(html).toContain('<h1>Sam Candidate</h1>');
    expect(html).toContain('Work Experience');
    expect(html).toContain('Certifications &amp; Achievements');
  });

  it('escapes HTML in user content', () => {
    const r = strongResume();
    r.fullName = 'Sam <script>alert(1)</script>';
    const html = buildDocHtml(r);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('embeds the photo only for the photo template', () => {
    const r = strongResume();
    r.photo = 'data:image/jpeg;base64,abc';
    expect(buildDocHtml(r)).not.toContain('<img');
    r.template = 'photo';
    expect(buildDocHtml(r)).toContain('<img src="data:image/jpeg;base64,abc"');
  });

  it('renders the photo template as a two-column sidebar table', () => {
    const r = strongResume();
    r.template = 'photo';
    const html = buildDocHtml(r);
    expect(html).toContain('td.side { background: #2c4a63');
    expect(html).toContain('width: 33%');
    expect(html).toContain('width: 67%');
    // Sidebar holds contact + education + skills; main holds summary/experience/certs.
    const side = html.slice(html.indexOf('<td class="side">'), html.indexOf('<td class="main">'));
    const main = html.slice(html.indexOf('<td class="main">'));
    expect(side).toContain('Education');
    expect(side).toContain('Skills');
    expect(side).toContain('sam@example.com');
    expect(main).toContain('Professional Summary');
    expect(main).toContain('Work Experience');
    expect(main).toContain('Certifications &amp; Achievements');
  });
});

describe('sidebarInk', () => {
  it('uses white text on dark colors and dark text on light colors', async () => {
    const { sidebarInk } = await import('../color');
    expect(sidebarInk('#2c4a63')).toBe('#ffffff');
    expect(sidebarInk('#f5d97a')).toBe('#1a1a1a');
    expect(sidebarInk('not-a-color')).toBe('#ffffff');
  });
});

describe('atsCheck', () => {
  it('scores a strong resume highly', () => {
    const s = atsCheck(strongResume());
    expect(s.score).toBeGreaterThanOrEqual(85);
  });

  it('scores an empty resume low but not zero (format points are by construction)', () => {
    const s = atsCheck(emptyResume());
    expect(s.score).toBeGreaterThan(0);
    expect(s.score).toBeLessThan(40);
  });

  it('rewards keyword coverage against a target posting', () => {
    const jd =
      'We need a developer with React, TypeScript, Jest and Git experience. Strong communication skills required.';
    const withTarget = atsCheck(strongResume(), jd);
    expect(withTarget.keywordCoverage).toBeGreaterThanOrEqual(60);
    expect(withTarget.missingKeywords).toContain('communication');
  });

  it('fails the action-verb check when bullets are weak', () => {
    const r = strongResume();
    r.experience[0].bullets = [
      'Responsible for the component library',
      'Was involved in performance work',
      'Duties included TypeScript migration',
    ];
    const s = atsCheck(r);
    const verbs = s.items.find((i) => i.id === 'verbs');
    expect(verbs?.passed).toBe(false);
  });

  it('detects missing contact details', () => {
    const r = strongResume();
    r.phone = '';
    const s = atsCheck(r);
    expect(s.items.find((i) => i.id === 'contact')?.passed).toBe(false);
  });
});
