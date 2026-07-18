import type { Finding, ScamReport } from './types';
import { firstPhraseFound, normalize } from './textUtils';

interface ScamRule {
  id: string;
  label: string;
  detail: string;
  severity: 'critical' | 'warning';
  weight: number;
  phrases?: string[];
  regex?: RegExp;
}

/**
 * Rules derived from FTC consumer alerts on job scams: upfront payments,
 * sensitive data before hire, personal-email recruiters, chat-app interviews,
 * and pay-first/no-duties offers.
 */
const RULES: ScamRule[] = [
  {
    id: 'upfront-payment',
    label: 'Asks you to pay for something',
    detail:
      'Legitimate employers never charge for equipment, training, software, or background checks. The FTC lists upfront payment as the single clearest scam signal.',
    severity: 'critical',
    weight: 60,
    phrases: [
      'pay for your equipment',
      'purchase equipment',
      'pay for training',
      'training fee',
      'application fee',
      'processing fee',
      'starter kit',
      'pay for your background check',
      'pay for a background check',
      'send payment',
      'registration fee',
      'administration fee',
    ],
  },
  {
    id: 'sensitive-info-early',
    label: 'Wants sensitive personal data before hiring',
    detail:
      'Requests for a Social Security number, bank details, or ID documents before an interview or formal offer are a hallmark of identity-theft scams.',
    severity: 'critical',
    weight: 55,
    phrases: [
      'social security number',
      'ssn',
      'bank account number',
      'bank details',
      'banking details',
      'routing number',
      'copy of your passport',
      'copy of your driver',
      'direct deposit information',
    ],
  },
  {
    id: 'money-movement',
    label: 'Involves moving money or packages',
    detail:
      '"Deposit a check and forward the money", reshipping packages, and crypto payments are money-laundering scams that can leave YOU legally liable.',
    severity: 'critical',
    weight: 60,
    phrases: [
      'wire transfer',
      'money order',
      'western union',
      'moneygram',
      'cashier’s check',
      "cashier's check",
      'deposit the check',
      'deposit a check',
      'check to deposit',
      'send you a check',
      'mail you a check',
      'reship',
      'reshipping',
      'package inspector',
      'package handler from home',
      'mystery shopper',
      'bitcoin',
      'cryptocurrency payment',
      'paid in crypto',
      'gift card',
    ],
  },
  {
    id: 'personal-email',
    label: 'Contact is a personal email address',
    detail:
      'Real recruiters write from corporate domains. A gmail/yahoo/hotmail/outlook contact for a company role is a strong scam indicator.',
    severity: 'warning',
    weight: 30,
    regex: /[a-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|aol|proton|icloud)\.[a-z]+/i,
  },
  {
    id: 'chat-app-interview',
    label: 'Interview or contact via chat app',
    detail:
      'Interviews conducted entirely over WhatsApp, Telegram, or text message are a classic pattern in fake-recruiter scams.',
    severity: 'warning',
    weight: 35,
    phrases: [
      'whatsapp',
      'telegram',
      'text us at',
      'text me at',
      'interview via chat',
      'interview will be conducted via text',
      'google chat interview',
    ],
  },
  {
    id: 'too-good',
    label: 'Pay far outweighs the ask',
    detail:
      'High daily/weekly pay with "no experience necessary" and vague duties is bait. Real employers describe the work before the money.',
    severity: 'warning',
    weight: 30,
    phrases: [
      'no experience necessary',
      'no experience needed',
      'no experience required',
      'earn up to',
      'per day guaranteed',
      'weekly pay guaranteed',
      'get paid daily',
      'daily payout',
      'quick money',
      'easy money',
    ],
  },
  {
    id: 'urgency-pressure',
    label: 'Artificial urgency to commit',
    detail:
      'Pressure to accept immediately, before questions are answered, is used to short-circuit your judgement.',
    severity: 'warning',
    weight: 20,
    phrases: [
      'immediate start required',
      'must start immediately',
      'respond within 24 hours',
      'limited slots',
      'positions filling fast',
      'act now',
      'offer expires',
    ],
  },
];

export function analyzeScam(text: string): ScamReport {
  const norm = normalize(text);
  const findings: Finding[] = [];

  for (const rule of RULES) {
    let evidence: string | undefined;
    if (rule.phrases) {
      evidence = firstPhraseFound(norm, rule.phrases);
    } else if (rule.regex) {
      evidence = text.match(rule.regex)?.[0];
    }
    if (evidence === undefined) continue;
    findings.push({
      id: rule.id,
      label: rule.label,
      detail: rule.detail,
      severity: rule.severity,
      weight: rule.weight,
      evidence,
    });
  }

  const score = Math.min(
    100,
    findings.reduce((s, f) => s + f.weight, 0),
  );
  const hasCritical = findings.some((f) => f.severity === 'critical');
  const level = hasCritical || score >= 60 ? 'danger' : score >= 25 ? 'suspicious' : 'clear';

  return { score, level, findings };
}
