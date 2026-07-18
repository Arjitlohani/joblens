import type { BuzzwordHit, Severity } from './types';
import { containsPhrase, normalize } from './textUtils';

interface BuzzwordRule {
  /** Any of these phrases triggers the rule. */
  phrases: string[];
  /** Canonical phrase shown to the user. */
  display: string;
  translation: string;
  severity: Severity;
}

/**
 * The corporate-speak decoder. Translations are deliberately blunt — the
 * point of the tool is to say what recruiters won't.
 */
const RULES: BuzzwordRule[] = [
  {
    phrases: ['fast-paced environment', 'fast paced environment', 'fast-paced'],
    display: 'fast-paced environment',
    translation: 'Often means understaffed. Expect a heavy workload from day one.',
    severity: 'caution',
  },
  {
    phrases: ['wear many hats', 'wearing many hats', 'wear multiple hats'],
    display: 'wear many hats',
    translation: 'Several jobs, one salary. Ask exactly which "hats" in the interview.',
    severity: 'caution',
  },
  {
    phrases: ['like a family', 'we are a family', "we're a family", 'family atmosphere', 'family environment'],
    display: 'we’re like a family',
    translation: 'Classic red flag for blurred boundaries and guilt-driven unpaid overtime.',
    severity: 'warning',
  },
  {
    phrases: ['self-starter', 'self starter', 'self-motivated', 'self motivated'],
    display: 'self-starter',
    translation: 'Expect little onboarding, training, or management support.',
    severity: 'caution',
  },
  {
    phrases: ['rockstar', 'rock star', 'ninja', 'guru', 'wizard', 'unicorn candidate', 'coding ninja'],
    display: 'rockstar / ninja / guru',
    translation: 'They want senior output, likely at a mid-level salary. Check the pay range.',
    severity: 'caution',
  },
  {
    phrases: ['work hard play hard', 'work hard, play hard'],
    display: 'work hard, play hard',
    translation: 'Long hours, compensated with pizza and a ping-pong table instead of money.',
    severity: 'warning',
  },
  {
    phrases: ['unlimited pto', 'unlimited vacation', 'unlimited time off', 'unlimited holidays'],
    display: 'unlimited PTO',
    translation:
      'No accrued days to pay out when you leave, and studies show people take LESS leave under it. Ask what the team actually takes.',
    severity: 'caution',
  },
  {
    phrases: ['thick skin', 'thick-skinned'],
    display: 'must have thick skin',
    translation: 'They are pre-warning you about how people are treated here.',
    severity: 'warning',
  },
  {
    phrases: ['hit the ground running'],
    display: 'hit the ground running',
    translation: 'No ramp-up period. You will be judged on output in week one.',
    severity: 'caution',
  },
  {
    phrases: ['ability to work under pressure', 'work well under pressure', 'handle pressure', 'high-pressure environment', 'high pressure environment'],
    display: 'work under pressure',
    translation: 'Deadlines are routinely unrealistic. Ask why the pressure exists.',
    severity: 'caution',
  },
  {
    phrases: ['other duties as assigned', 'other duties as required', 'duties may vary'],
    display: 'other duties as assigned',
    translation: 'A blank cheque for scope creep. Your real job may not match this posting.',
    severity: 'caution',
  },
  {
    phrases: ['competitive salary', 'competitive pay', 'competitive compensation', 'salary commensurate with experience'],
    display: 'competitive salary (no numbers)',
    translation:
      'If it were genuinely competitive, they would print the number. Expect to negotiate hard.',
    severity: 'warning',
  },
  {
    phrases: ['hustle', 'hustle culture', 'grind'],
    display: 'hustle / grind',
    translation: 'Overwork is a core value here, not an accident.',
    severity: 'warning',
  },
  {
    phrases: ['wearer of many hats'],
    display: 'wearer of many hats',
    translation: 'Several jobs, one salary.',
    severity: 'caution',
  },
  {
    phrases: ['flexible hours', 'flexible schedule', 'flexible working hours'],
    display: 'flexible hours',
    translation:
      'Can be genuine — or can mean "your hours flex to ours". Clarify who controls the flexibility.',
    severity: 'info',
  },
  {
    phrases: ['dynamic environment', 'ever-changing environment', 'constantly evolving'],
    display: 'dynamic / ever-changing environment',
    translation: 'Priorities change weekly. Ask how decisions get made and unmade.',
    severity: 'info',
  },
  {
    phrases: ['passionate', 'passion for'],
    display: 'passionate',
    translation:
      'Fine on its own — but "passion" is often the justification for below-market pay.',
    severity: 'info',
  },
  {
    phrases: ['entrepreneurial spirit', 'entrepreneurial mindset', 'owner mentality', 'ownership mentality'],
    display: 'entrepreneurial spirit',
    translation: 'Founder-level responsibility without founder-level equity.',
    severity: 'caution',
  },
  {
    phrases: ['must be a team player', 'team player'],
    display: 'team player',
    translation: 'Usually harmless. Occasionally means "will absorb other people’s work quietly".',
    severity: 'info',
  },
  {
    phrases: ['no drama', 'drama-free', 'leave your ego at the door'],
    display: 'no drama',
    translation: 'There is drama. They are telling you there is drama.',
    severity: 'warning',
  },
  {
    phrases: ['startup mentality', 'startup environment', 'scrappy'],
    display: 'startup mentality / scrappy',
    translation: 'Low budget, few processes, broad unpaid responsibility. Great for learning, hard on hours.',
    severity: 'caution',
  },
  {
    phrases: ['always on', '24/7 mindset', 'whatever it takes'],
    display: 'whatever it takes / always on',
    translation: 'Expect evenings and weekends. Ask directly about on-call and overtime.',
    severity: 'warning',
  },
];

/** Scan a posting for corporate-speak and return the decoded hits. */
export function decodeBuzzwords(text: string): BuzzwordHit[] {
  const norm = normalize(text);
  const hits: BuzzwordHit[] = [];
  for (const rule of RULES) {
    if (rule.phrases.some((p) => containsPhrase(norm, p))) {
      hits.push({
        phrase: rule.display,
        translation: rule.translation,
        severity: rule.severity,
      });
    }
  }
  return hits;
}
