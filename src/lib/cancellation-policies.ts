// Cancellation Policy Definitions for Vacation Rentals
// Supports both legacy hardcoded policies and database-driven custom policies

import { differenceInDays } from 'date-fns';

export type CancellationPolicyKey = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

export interface CancellationRule {
  daysBeforeCheckIn: number; // Cutoff in days (e.g., 7 means "7+ days before check-in")
  refundPercentage: number;  // 100 = full refund, 50 = half, 0 = none
  label?: string;            // Optional human-readable description
}

export interface CancellationPolicy {
  key: CancellationPolicyKey;
  label: string;
  description: string;
  shortDescription: string;
  rules: CancellationRule[];
  color: string; // For badges/UI
}

// Legacy hardcoded policies (kept for backward compatibility)
export const CANCELLATION_POLICIES: Record<CancellationPolicyKey, CancellationPolicy> = {
  flexible: {
    key: 'flexible',
    label: 'Flexible',
    description: 'Full refund up to 7 days before check-in. 50% refund 3-7 days before. No refund within 3 days.',
    shortDescription: 'Free cancellation up to 7 days before',
    rules: [
      { daysBeforeCheckIn: 7, refundPercentage: 100, label: 'Full refund if cancelled 7+ days before check-in' },
      { daysBeforeCheckIn: 3, refundPercentage: 50, label: '50% refund if cancelled 3-7 days before check-in' },
      { daysBeforeCheckIn: 0, refundPercentage: 0, label: 'No refund within 3 days of check-in' },
    ],
    color: 'green',
  },
  moderate: {
    key: 'moderate',
    label: 'Moderate',
    description: 'Full refund up to 14 days before check-in. 50% refund 7-14 days before. No refund within 7 days.',
    shortDescription: 'Free cancellation up to 14 days before',
    rules: [
      { daysBeforeCheckIn: 14, refundPercentage: 100, label: 'Full refund if cancelled 14+ days before check-in' },
      { daysBeforeCheckIn: 7, refundPercentage: 50, label: '50% refund if cancelled 7-14 days before check-in' },
      { daysBeforeCheckIn: 0, refundPercentage: 0, label: 'No refund within 7 days of check-in' },
    ],
    color: 'yellow',
  },
  strict: {
    key: 'strict',
    label: 'Strict',
    description: 'Full refund up to 30 days before check-in. 50% refund 14-30 days before. No refund within 14 days.',
    shortDescription: 'Free cancellation up to 30 days before',
    rules: [
      { daysBeforeCheckIn: 30, refundPercentage: 100, label: 'Full refund if cancelled 30+ days before check-in' },
      { daysBeforeCheckIn: 14, refundPercentage: 50, label: '50% refund if cancelled 14-30 days before check-in' },
      { daysBeforeCheckIn: 0, refundPercentage: 0, label: 'No refund within 14 days of check-in' },
    ],
    color: 'orange',
  },
  non_refundable: {
    key: 'non_refundable',
    label: 'Non-Refundable',
    description: 'This rate is non-refundable. No refund at any time after booking.',
    shortDescription: 'No refund at any time',
    rules: [
      { daysBeforeCheckIn: 0, refundPercentage: 0, label: 'Non-refundable – no cancellation refund' },
    ],
    color: 'red',
  },
};

export interface RefundCalculation {
  refundAmount: number;
  refundPercentage: number;
  message: string;
  policyLabel: string;
  daysUntilCheckIn: number;
}

/**
 * Calculate refund amount based on cancellation policy key (legacy)
 */
export function calculateRefund(
  policyKey: CancellationPolicyKey,
  checkInDate: Date,
  cancellationDate: Date,
  totalAmount: number
): RefundCalculation {
  const policy = CANCELLATION_POLICIES[policyKey];
  return calculateRefundFromPolicy(
    { rules: policy.rules, name: policy.label },
    checkInDate,
    cancellationDate,
    totalAmount
  );
}

/**
 * Calculate refund from database policy object (new)
 */
export function calculateRefundFromPolicy(
  policy: { rules: CancellationRule[]; name?: string },
  checkInDate: Date,
  cancellationDate: Date,
  totalAmount: number
): RefundCalculation {
  const daysUntilCheckIn = differenceInDays(checkInDate, cancellationDate);
  const sortedRules = [...policy.rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);

  // Find applicable rule
  let applicableRule = sortedRules[sortedRules.length - 1]; // Default to last rule (0 days)
  
  for (const rule of sortedRules) {
    if (daysUntilCheckIn >= rule.daysBeforeCheckIn) {
      applicableRule = rule;
      break;
    }
  }

  const refundPercentage = applicableRule.refundPercentage;
  const refundAmount = Math.round((totalAmount * refundPercentage) / 100 * 100) / 100;

  // Generate message
  let message = applicableRule.label || '';
  if (!message) {
    if (refundPercentage === 100) {
      message = 'Full refund available';
    } else if (refundPercentage === 0) {
      message = 'No refund available';
    } else {
      message = `${refundPercentage}% refund available`;
    }
  }

  return {
    refundAmount,
    refundPercentage,
    message,
    policyLabel: policy.name || 'Custom Policy',
    daysUntilCheckIn,
  };
}

/**
 * Get policy-specific cancellation deadlines for a given check-in date
 */
export function getCancellationDeadlines(
  policyKey: CancellationPolicyKey,
  checkInDate: Date
): { deadline: Date; refundPercentage: number; label: string }[] {
  const policy = CANCELLATION_POLICIES[policyKey];
  return getCancellationDeadlinesFromRules(policy.rules, checkInDate);
}

/**
 * Get cancellation deadlines from database policy rules
 */
export function getCancellationDeadlinesFromRules(
  rules: CancellationRule[],
  checkInDate: Date
): { deadline: Date; refundPercentage: number; label: string }[] {
  return rules
    .filter(rule => rule.daysBeforeCheckIn > 0)
    .sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
    .map(rule => {
      const deadline = new Date(checkInDate);
      deadline.setDate(deadline.getDate() - rule.daysBeforeCheckIn);
      return {
        deadline,
        refundPercentage: rule.refundPercentage,
        label: rule.label || `${rule.refundPercentage}% refund`,
      };
    });
}

/**
 * Get a human-readable summary of policy terms (legacy key-based)
 */
export function getPolicySummary(
  policyKey: CancellationPolicyKey,
  checkInDate: Date
): string[] {
  const policy = CANCELLATION_POLICIES[policyKey];
  return getPolicySummaryFromRules(policy.rules, checkInDate, policyKey === 'non_refundable');
}

/**
 * Get a human-readable summary from database policy rules
 */
export function getPolicySummaryFromRules(
  rules: CancellationRule[],
  checkInDate: Date,
  isNonRefundable: boolean = false
): string[] {
  if (isNonRefundable || (rules.length === 1 && rules[0].refundPercentage === 0)) {
    return ['This booking is non-refundable'];
  }

  const deadlines = getCancellationDeadlinesFromRules(rules, checkInDate);
  const summaryLines: string[] = [];
  
  deadlines.forEach((deadline, index) => {
    const formattedDate = deadline.deadline.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (deadline.refundPercentage === 100) {
      summaryLines.push(`Free cancellation until ${formattedDate}`);
    } else if (deadline.refundPercentage > 0) {
      const nextDeadline = deadlines[index + 1];
      const nextDate = nextDeadline 
        ? nextDeadline.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      summaryLines.push(`${deadline.refundPercentage}% refund if cancelled ${formattedDate} - ${nextDate}`);
    }
  });

  // Add no refund line
  const sortedRules = [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);
  const minDaysWithRefund = sortedRules
    .filter(r => r.refundPercentage > 0)
    .reduce((min, r) => Math.min(min, r.daysBeforeCheckIn), Infinity);
  
  if (minDaysWithRefund !== Infinity && minDaysWithRefund > 0) {
    summaryLines.push(`No refund within ${minDaysWithRefund} days of check-in`);
  }

  return summaryLines;
}

/**
 * Get badge color class based on policy key (legacy)
 */
export function getPolicyBadgeClass(policyKey: CancellationPolicyKey): string {
  const policy = CANCELLATION_POLICIES[policyKey];
  return getPolicyBadgeClassByColor(policy.color);
}

/**
 * Get badge color class by color name (for database policies)
 */
export function getPolicyBadgeClassByColor(color: string): string {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  
  return colorMap[color] || colorMap.yellow;
}
