/**
 * Job search over free, keyless, CORS-enabled public job APIs.
 *
 * Sources:
 *  - Remotive  (https://remotive.com/api/remote-jobs)      — remote roles
 *  - Arbeitnow (https://www.arbeitnow.com/api/job-board-api) — mostly EU/remote
 *  - Jobicy    (https://jobicy.com/api/v2/remote-jobs)     — remote roles by region
 *
 * Only the search keyword is sent to these APIs — never anything the user
 * typed into the resume builder or analyzer. Location filtering happens
 * locally in the browser.
 */

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  /** Plain-text description (HTML stripped). */
  description: string;
  postedAt?: string;
  source: 'Remotive' | 'Arbeitnow' | 'Jobicy';
}

export interface SearchOutcome {
  jobs: JobListing[];
  /** Sources that failed, for a partial-results notice. */
  failedSources: string[];
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+\n/g, '\n').trim();
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  salary: string;
  url: string;
  description: string;
  publication_date: string;
}

async function searchRemotive(keyword: string): Promise<JobListing[]> {
  const data = (await fetchJson(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=30`,
  )) as { jobs: RemotiveJob[] };
  return data.jobs.map((j) => ({
    id: `remotive-${j.id}`,
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || 'Remote',
    salary: j.salary || undefined,
    url: j.url,
    description: stripHtml(j.description),
    postedAt: j.publication_date?.slice(0, 10),
    source: 'Remotive' as const,
  }));
}

interface ArbeitnowJob {
  slug: string;
  title: string;
  company_name: string;
  location: string;
  url: string;
  description: string;
  remote: boolean;
  created_at: number;
}

async function searchArbeitnow(): Promise<JobListing[]> {
  const data = (await fetchJson('https://www.arbeitnow.com/api/job-board-api')) as {
    data: ArbeitnowJob[];
  };
  return data.data.map((j) => ({
    id: `arbeitnow-${j.slug}`,
    title: j.title,
    company: j.company_name,
    location: j.remote ? `${j.location} (remote)` : j.location,
    url: j.url,
    description: stripHtml(j.description),
    postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString().slice(0, 10) : undefined,
    source: 'Arbeitnow' as const,
  }));
}

interface JobicyJob {
  id: number;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  url: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
}

async function searchJobicy(): Promise<JobListing[]> {
  const data = (await fetchJson('https://jobicy.com/api/v2/remote-jobs?count=50')) as {
    jobs: JobicyJob[];
  };
  return data.jobs.map((j) => ({
    id: `jobicy-${j.id}`,
    title: j.jobTitle,
    company: j.companyName,
    location: j.jobGeo || 'Remote',
    salary:
      j.annualSalaryMin && j.annualSalaryMax
        ? `${j.salaryCurrency ?? ''} ${j.annualSalaryMin.toLocaleString()}–${j.annualSalaryMax.toLocaleString()}`
        : undefined,
    url: j.url,
    description: stripHtml(j.jobDescription),
    postedAt: j.pubDate?.slice(0, 10),
    source: 'Jobicy' as const,
  }));
}

function matchesKeyword(job: JobListing, keyword: string): boolean {
  if (keyword === '') return true;
  const k = keyword.toLowerCase();
  return (
    job.title.toLowerCase().includes(k) ||
    job.company.toLowerCase().includes(k) ||
    job.description.toLowerCase().includes(k)
  );
}

function matchesLocation(job: JobListing, location: string): boolean {
  if (location === '') return true;
  const l = location.toLowerCase();
  const loc = job.location.toLowerCase();
  // "Anywhere"/"Worldwide" remote roles match any location the user types.
  return (
    loc.includes(l) ||
    loc.includes('worldwide') ||
    loc.includes('anywhere') ||
    loc === 'remote'
  );
}

/** Query all sources, then filter by keyword + location locally. */
export async function searchJobs(keyword: string, location: string): Promise<SearchOutcome> {
  const kw = keyword.trim();
  const loc = location.trim();

  const sources: Array<[string, Promise<JobListing[]>]> = [
    ['Remotive', searchRemotive(kw)],
    ['Arbeitnow', searchArbeitnow()],
    ['Jobicy', searchJobicy()],
  ];

  const jobs: JobListing[] = [];
  const failedSources: string[] = [];

  const settled = await Promise.allSettled(sources.map(([, p]) => p));
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') jobs.push(...result.value);
    else failedSources.push(sources[i][0]);
  });

  const filtered = jobs.filter((j) => matchesKeyword(j, kw) && matchesLocation(j, loc));
  filtered.sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));
  return { jobs: filtered, failedSources };
}
