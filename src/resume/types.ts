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

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  /** Optional links, e.g. LinkedIn or portfolio URL. */
  links: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
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
    skills: [],
    experience: [],
    education: [],
    certifications: [],
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
