import { containsPhrase, normalize } from './textUtils';

/**
 * Skill dictionary. Each group is [canonical, ...synonyms]. Matching any
 * variant counts as the skill being present; the surface form actually used
 * is preserved so the UI can advise mirroring the posting's exact wording
 * (ATS software matches literally — "martech" ≠ "marketing automation").
 */
const SKILL_GROUPS: string[][] = [
  // — Software / IT —
  ['javascript', 'js', 'ecmascript'],
  ['typescript', 'ts'],
  ['python'],
  ['java'],
  ['c#', 'csharp', 'c sharp'],
  ['c++', 'cpp'],
  ['sql', 'mysql', 'postgresql', 'postgres', 'sql server', 't-sql'],
  ['react', 'react.js', 'reactjs'],
  ['angular', 'angularjs'],
  ['vue', 'vue.js', 'vuejs'],
  ['node.js', 'node', 'nodejs'],
  ['next.js', 'nextjs'],
  ['html', 'html5'],
  ['css', 'css3', 'scss', 'sass'],
  ['tailwind', 'tailwindcss', 'tailwind css'],
  ['rest api', 'rest apis', 'restful', 'web api', 'apis'],
  ['graphql'],
  ['aws', 'amazon web services'],
  ['azure', 'microsoft azure'],
  ['gcp', 'google cloud'],
  ['docker', 'containers', 'containerization'],
  ['kubernetes', 'k8s'],
  ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery', 'devops pipeline'],
  ['git', 'github', 'gitlab', 'version control'],
  ['linux', 'unix'],
  ['agile', 'scrum', 'kanban'],
  ['unit testing', 'automated testing', 'test automation', 'jest', 'pytest', 'tdd'],
  ['machine learning', 'ml'],
  ['artificial intelligence', 'ai'],
  ['llm', 'large language models', 'generative ai', 'genai'],
  ['data analysis', 'data analytics', 'analytics'],
  ['power bi', 'powerbi'],
  ['tableau'],
  ['excel', 'microsoft excel', 'spreadsheets', 'advanced excel'],
  ['active directory', 'ad'],
  ['office 365', 'microsoft 365', 'o365', 'ms office', 'microsoft office'],
  ['troubleshooting', 'technical support', 'it support', 'help desk', 'helpdesk', 'service desk'],
  ['networking', 'tcp/ip', 'dns', 'vpn', 'lan'],
  ['cybersecurity', 'information security', 'infosec', 'security'],
  ['salesforce', 'crm', 'hubspot', 'dynamics 365'],
  ['jira', 'confluence', 'atlassian'],
  ['php', 'laravel', 'wordpress'],
  ['mobile development', 'ios', 'android', 'react native', 'flutter'],
  ['cloud computing', 'cloud infrastructure', 'cloud services'],
  ['powershell', 'bash', 'shell scripting', 'scripting'],
  ['etl', 'data pipelines', 'data engineering'],
  ['nosql', 'mongodb', 'dynamodb', 'redis'],
  ['ui/ux', 'ux', 'ui design', 'user experience', 'figma'],
  ['marketing automation', 'martech'],
  ['seo', 'search engine optimization', 'sem'],
  ['api integration', 'system integration', 'integrations'],

  // — General professional —
  ['communication', 'communication skills', 'written communication', 'verbal communication'],
  ['customer service', 'client service', 'customer support', 'customer care', 'client relations', 'customer-facing'],
  ['teamwork', 'collaboration', 'cross-functional', 'team player'],
  ['problem solving', 'problem-solving', 'analytical skills', 'critical thinking'],
  ['time management', 'prioritization', 'prioritisation', 'multitasking', 'multi-tasking'],
  ['leadership', 'team leadership', 'people management', 'mentoring', 'supervising', 'supervision'],
  ['project management', 'project coordination', 'pmp', 'prince2'],
  ['stakeholder management', 'stakeholder engagement', 'stakeholders'],
  ['attention to detail', 'detail-oriented', 'detail oriented', 'accuracy'],
  ['organization', 'organisation', 'organizational skills', 'organisational skills'],
  ['data entry', 'record keeping', 'record-keeping', 'records management'],
  ['scheduling', 'calendar management', 'rostering', 'diary management'],
  ['reporting', 'report writing', 'documentation'],
  ['training', 'onboarding', 'coaching'],
  ['negotiation', 'conflict resolution'],
  ['presentation', 'presentations', 'public speaking'],
  ['budgeting', 'budget management', 'cost control', 'forecasting'],
  ['compliance', 'regulatory compliance', 'audit', 'quality assurance', 'qa'],
  ['inventory management', 'stock control', 'stocktake', 'inventory'],
  ['sales', 'upselling', 'cross-selling', 'business development'],
  ['administration', 'administrative support', 'admin support', 'office administration'],
  ['invoicing', 'accounts payable', 'accounts receivable', 'billing', 'bookkeeping'],
  ['recruitment', 'talent acquisition', 'recruiting'],
  ['social media', 'content creation', 'copywriting'],
  ['bilingual', 'multilingual'],

  // — Hospitality / retail / front-of-house —
  ['pos systems', 'pos', 'point of sale', 'point-of-sale', 'square', 'toast pos'],
  ['food safety', 'food handling', 'haccp', 'food hygiene'],
  ['barista', 'coffee preparation', 'espresso', 'latte art'],
  ['bartending', 'mixology', 'cocktails', 'bar service'],
  ['rsa', 'responsible service of alcohol', 'alcohol service'],
  ['front of house', 'foh', 'front-of-house'],
  ['table service', 'fine dining', 'silver service', 'waitstaff', 'waiting tables'],
  ['cash handling', 'cash register', 'till operation', 'reconciliation'],
  ['reservations', 'booking systems', 'opentable'],
  ['event coordination', 'event management', 'functions', 'catering'],
  ['housekeeping', 'cleaning', 'sanitation'],
  ['barback', 'busser', 'runner'],
  ['guest relations', 'guest services', 'hospitality'],
  ['kitchen operations', 'food preparation', 'food prep', 'line cook'],
  ['first aid', 'cpr'],
  ['forklift', 'warehouse', 'picking and packing'],
  ['driver’s license', "driver's license", 'drivers license', 'driving licence'],
];

export interface ExtractedKeyword {
  /** Canonical name of the skill group. */
  canonical: string;
  /** The surface form actually used in the posting. */
  jdForm: string;
  /** How many times any variant appears in the posting. */
  occurrences: number;
}

function countOccurrences(norm: string, phrase: string): number {
  const escaped = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi');
  return (norm.match(re) ?? []).length;
}

/** Extract the skills a posting asks for, ranked by how often they appear. */
export function extractKeywords(jobText: string): ExtractedKeyword[] {
  const norm = normalize(jobText);
  const out: ExtractedKeyword[] = [];

  for (const group of SKILL_GROUPS) {
    let jdForm: string | undefined;
    let total = 0;
    for (const variant of group) {
      const n = countOccurrences(norm, variant);
      if (n > 0 && jdForm === undefined) jdForm = variant;
      total += n;
    }
    if (jdForm !== undefined) {
      out.push({ canonical: group[0], jdForm, occurrences: total });
    }
  }

  return out.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Find which variant of a skill group a resume uses, if any.
 * Returns the surface form found, or undefined when the skill is absent.
 */
export function findInResume(canonical: string, resumeText: string): string | undefined {
  const group = SKILL_GROUPS.find((g) => g[0] === canonical);
  if (!group) return undefined;
  const norm = normalize(resumeText);
  return group.find((variant) => containsPhrase(norm, variant));
}
