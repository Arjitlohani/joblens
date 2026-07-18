import type { Analysis, PostingAge, Verdict } from './types';
import { analyzeGhost } from './ghost';
import { analyzeScam } from './scam';
import { decodeBuzzwords } from './buzzwords';
import { analyzeSalary } from './salary';
import { analyzeRequirements } from './requirements';
import { matchResume } from './matcher';
import { wordCount } from './textUtils';

export interface AnalyzeInput {
  jobText: string;
  resumeText?: string;
  postingAge?: PostingAge;
}

function verdictFor(a: Omit<Analysis, 'verdict' | 'verdictReason'>): {
  verdict: Verdict;
  reason: string;
} {
  if (a.scam.level === 'danger') {
    return {
      verdict: 'scam',
      reason:
        'This posting shows hallmark signs of a job scam. Do not share personal or financial information — report it at ReportFraud.ftc.gov.',
    };
  }
  if (a.ghost.level === 'high') {
    return {
      verdict: 'skip',
      reason:
        'Multiple strong ghost-job signals. If you apply, spend minutes on it, not hours — and verify the role exists on the company’s own careers page first.',
    };
  }
  if (a.scam.level === 'suspicious' || a.ghost.level === 'moderate') {
    return {
      verdict: 'caution',
      reason:
        'Worth applying, but with your eyes open: verify the posting on the company’s careers page and keep your expectations calibrated.',
    };
  }
  return {
    verdict: 'apply',
    reason:
      'No major red flags detected. This looks like a real, fillable role — worth a properly tailored application.',
  };
}

/** Run the full JobLens analysis over a posting (and optionally a resume). */
export function analyze(input: AnalyzeInput): Analysis {
  const { jobText, resumeText, postingAge = 'unknown' } = input;

  const salary = analyzeSalary(jobText);
  const partial = {
    ghost: analyzeGhost(jobText, postingAge, salary),
    scam: analyzeScam(jobText),
    buzzwords: decodeBuzzwords(jobText),
    salary,
    requirements: analyzeRequirements(jobText),
    match:
      resumeText && resumeText.trim().length > 0
        ? matchResume(jobText, resumeText)
        : undefined,
    wordCount: wordCount(jobText),
  };

  const { verdict, reason } = verdictFor(partial);
  return { ...partial, verdict, verdictReason: reason };
}
