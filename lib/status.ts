import { TestStatus } from './types';

/**
 * Parses numeric strings including Indian numbering (e.g. "2,40,000", "11,200", "9.8 g/dL")
 */
export function parseNumericValue(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // Extract first number match with optional commas, negative sign, and decimals
  // Matches e.g. "2,40,000", "11,200.5", "9.8", "-5.2", "< 0.5" -> "0.5"
  const cleaned = str.replace(/^[^\d\-+.]*/, ''); // strip leading non-number chars
  const match = cleaned.match(/^[-+]?(?:\d{1,3}(?:,\d{2,3})*|\d+)(?:\.\d+)?/);
  if (!match) return null;

  // Remove commas (handles both Indian 2,40,000 and Western 240,000)
  const normalized = match[0].replace(/,/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

interface ParsedRange {
  type: 'two_sided' | 'less_than' | 'greater_than';
  lower?: number;
  upper?: number;
}

/**
 * Parses reference range strings like:
 * - "12.0–15.5", "12.0-15.5", "12.0 - 15.5", "12.0 to 15.5"
 * - "<200", "<= 200", "less than 200"
 * - ">40", ">= 40", "greater than 40"
 * - "Up to 5", "up to 5.0"
 */
export function parseReferenceRange(raw: string | undefined | null): ParsedRange | null {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim();
  if (!str) return null;

  // Normalize en-dash, em-dash to hyphen
  const normalized = str
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ');

  // Less than / up to: "< 200", "<= 200", "up to 5", "less than 200"
  const lessThanMatch = normalized.match(/^(?:<|<=|less than|up to)\s*([\d,.]+)/i);
  if (lessThanMatch) {
    const upper = parseNumericValue(lessThanMatch[1]);
    if (upper !== null) {
      return { type: 'less_than', upper };
    }
  }

  // Greater than: "> 40", ">= 40", "greater than 40", "more than 40"
  const greaterThanMatch = normalized.match(/^(?:>|>=|greater than|more than)\s*([\d,.]+)/i);
  if (greaterThanMatch) {
    const lower = parseNumericValue(greaterThanMatch[1]);
    if (lower !== null) {
      return { type: 'greater_than', lower };
    }
  }

  // Two-sided ranges: "12.0 - 15.5", "12.0 to 15.5", "4,000 - 11,000"
  const twoSidedMatch = normalized.match(/([\d,.]+)\s*(?:-|to)\s*([\d,.]+)/i);
  if (twoSidedMatch) {
    const lower = parseNumericValue(twoSidedMatch[1]);
    const upper = parseNumericValue(twoSidedMatch[2]);
    if (lower !== null && upper !== null && lower <= upper) {
      return { type: 'two_sided', lower, upper };
    }
  }

  return null;
}

/**
 * Deterministically computes test status using server-side rules:
 * - within range = normal
 * - outside by <= 10% of the nearest bound = slightly_high / slightly_low
 * - more than 10% = high / low
 * - unparseable = unclear
 */
export function computeTestStatus(
  rawVal: string | number | undefined | null,
  rawRange: string | undefined | null
): TestStatus {
  const value = parseNumericValue(rawVal);
  if (value === null) return 'unclear';

  const range = parseReferenceRange(rawRange);
  if (!range) return 'unclear';

  if (range.type === 'two_sided' && range.lower !== undefined && range.upper !== undefined) {
    const { lower, upper } = range;

    if (value >= lower && value <= upper) {
      return 'normal';
    }

    if (value > upper) {
      // Nearest bound is upper
      const boundRef = Math.abs(upper) > 0 ? Math.abs(upper) : (upper - lower);
      const margin = 0.10 * boundRef;
      return value <= upper + margin ? 'slightly_high' : 'high';
    }

    if (value < lower) {
      // Nearest bound is lower
      const boundRef = Math.abs(lower) > 0 ? Math.abs(lower) : (upper - lower);
      const margin = 0.10 * boundRef;
      return value >= lower - margin ? 'slightly_low' : 'low';
    }
  }

  if (range.type === 'less_than' && range.upper !== undefined) {
    const { upper } = range;
    if (value <= upper) {
      return 'normal';
    }
    const margin = 0.10 * Math.abs(upper);
    return value <= upper + margin ? 'slightly_high' : 'high';
  }

  if (range.type === 'greater_than' && range.lower !== undefined) {
    const { lower } = range;
    if (value >= lower) {
      return 'normal';
    }
    const margin = 0.10 * Math.abs(lower);
    return value >= lower - margin ? 'slightly_low' : 'low';
  }

  return 'unclear';
}
