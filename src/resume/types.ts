/** Data model for the ATS resume builder. */

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export type ResumeTemplate = 'ats' | 'photo';

export type SkillsMode = 'combined' | 'split';

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  /** Optional links, e.g. LinkedIn or portfolio URL. */
  links: string;
  headline: string;
  summary: string;
  /** 'combined': one skills list. 'split': `skills` = hard, `softSkills` = soft. */
  skillsMode: SkillsMode;
  skills: string[];
  softSkills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  /** Certifications and achievements — rendered as one section. */
  certifications: string[];
  /** 'ats': parser-first layout. 'photo': compact one-page with a photo. */
  template: ResumeTemplate;
  /** Data-URL of the photo, only used by the 'photo' template. */
  photo?: string;
}

export function emptyResume(): ResumeData {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    links: '',
    headline: '',
    summary: '',
    skillsMode: 'combined',
    skills: [],
    softSkills: [],
    experience: [],
    education: [],
    certifications: [],
    template: 'ats',
    photo: undefined,
  };
}

export interface AtsCheckItem {
  id: string;
  label: string;
  /** Points earned / points available. */
  earned: number;
  available: number;
  passed: boolean;
  tip: string;
}

export interface AtsScore {
  /** 0–100 overall. */
  score: number;
  items: AtsCheckItem[];
  /** Present only when a target job posting was provided. */
  keywordCoverage?: number;
  missingKeywords: string[];
}
