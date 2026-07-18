/**
 * Job search over free, keyless, CORS-enabled public job APIs.
 *
 * Sources:
 *  - Remotive (https://remotive.com/api/remote-jobs) — remote roles
 *  - Arbeitnow (https://www.arbeitnow.com/api/job-board-api) — mostly EU/remote
 *
 * Only the search term is sent to these APIs — never anything the user
 * pasted or typed into the resume builder or analyzer.
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
  source: 'Remotive' | 'Arbeitnow';
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

async function searchRemotive(query: string): Promise<JobListing[]> {
  const data = (await fetchJson(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=20`,
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

async function searchArbeitnow(query: string): Promise<JobListing[]> {
  const data = (await fetchJson('https://www.arbeitnow.com/api/job-board-api')) as {
    data: ArbeitnowJob[];
  };
  const q = query.toLowerCase();
  return data.data
    .filter(
      (j) =>
        q === '' ||
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q),
    )
    .slice(0, 20)
    .map((j) => ({
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

/** Query both sources; tolerate individual failures. */
export async function searchJobs(query: string): Promise<SearchOutcome> {
  const sources: Array<[string, Promise<JobListing[]>]> = [
    ['Remotive', searchRemotive(query)],
    ['Arbeitnow', searchArbeitnow(query)],
  ];

  const jobs: JobListing[] = [];
  const failedSources: string[] = [];

  const settled = await Promise.allSettled(sources.map(([, p]) => p));
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') jobs.push(...result.value);
    else failedSources.push(sources[i][0]);
  });

  jobs.sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));
  return { jobs, failedSources };
}
