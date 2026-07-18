import type { SalaryReport } from './types';

const CURRENCY = /[$£€]\s?\d[\d,]*(?:\.\d+)?\s?[kK]?/;

const RANGE = new RegExp(
  `(${CURRENCY.source})\\s*(?:-|–|—|to|up to)\\s*(${CURRENCY.source})`,
  'i',
);

const HOURLY_HINT = /(per hour|\/\s?hr|\/\s?hour|hourly|an hour)/i;

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[$£€,\s]/g, '');
  const isK = /k$/i.test(cleaned);
  const n = parseFloat(cleaned.replace(/k$/i, ''));
  return isK ? n * 1000 : n;
}

/**
 * Detect whether a posting discloses pay, and whether the disclosed range is
 * wide enough to be meaningless (a known ghost-posting pattern — e.g.
 * "$40,000–$150,000" tells you nothing and often signals no budgeted role).
 */
export function analyzeSalary(text: string): SalaryReport {
  const rangeMatch = text.match(RANGE);
  if (rangeMatch) {
    const min = parseAmount(rangeMatch[1]);
    const max = parseAmount(rangeMatch[2]);
    const hourly = HOURLY_HINT.test(text);
    // A range whose top is more than ~1.8x its bottom carries no information.
    // Hourly ranges are naturally narrow, so the same ratio applies.
    const suspiciouslyWide = min > 0 && max / min > 1.8;
    return {
      disclosed: true,
      text: rangeMatch[0] + (hourly ? ' (hourly)' : ''),
      min,
      max,
      suspiciouslyWide,
    };
  }

  const single = text.match(CURRENCY);
  if (single && parseAmount(single[0]) >= 15) {
    return {
      disclosed: true,
      text: single[0],
      min: parseAmount(single[0]),
      max: parseAmount(single[0]),
      suspiciouslyWide: false,
    };
  }

  return { disclosed: false, suspiciouslyWide: false };
}
