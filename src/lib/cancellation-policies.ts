// Cancellation Policy Definitions for Vacation Rentals
// Industry-standard policies aligned with vacation rental norms

import { differenceInDays } from 'date-fns';

export type CancellationPolicyKey = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

export interface CancellationRule {
  daysBeforeCheckIn: number; // Cutoff in days (e.g., 7 means "7+ days before check-in")
  refundPercentage: number;  // 100 = full refund, 50 = half, 0 = none
  label: string;             // Human-readable description
}

export interface CancellationPolicy {
  key: CancellationPolicyKey;
  label: string;
  description: string;
  shortDescription: string;
  rules: CancellationRule[];
  color: string; // For badges/UI
}

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
 * Calculate refund amount based on cancellation policy, check-in date, and cancellation time
 */
export function calculateRefund(
  policyKey: CancellationPolicyKey,
  checkInDate: Date,
  cancellationDate: Date,
  totalAmount: number
): RefundCalculation {
  const policy = CANCELLATION_POLICIES[policyKey];
  const daysUntilCheckIn = differenceInDays(checkInDate, cancellationDate);

  // Find applicable rule (rules are sorted by daysBeforeCheckIn descending)
  let applicableRule = policy.rules[policy.rules.length - 1]; // Default to last rule (0 days)
  
  for (const rule of policy.rules) {
    if (daysUntilCheckIn >= rule.daysBeforeCheckIn) {
      applicableRule = rule;
      break;
    }
  }

  const refundPercentage = applicableRule.refundPercentage;
  const refundAmount = Math.round((totalAmount * refundPercentage) / 100 * 100) / 100; // Round to 2 decimal places

  return {
    refundAmount,
    refundPercentage,
    message: applicableRule.label,
    policyLabel: policy.label,
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
  
  return policy.rules
    .filter(rule => rule.daysBeforeCheckIn > 0)
    .map(rule => {
      const deadline = new Date(checkInDate);
      deadline.setDate(deadline.getDate() - rule.daysBeforeCheckIn);
      return {
        deadline,
        refundPercentage: rule.refundPercentage,
        label: rule.label,
      };
    });
}

/**
 * Get a human-readable summary of policy terms for checkout display
 */
export function getPolicySummary(
  policyKey: CancellationPolicyKey,
  checkInDate: Date
): string[] {
  const deadlines = getCancellationDeadlines(policyKey, checkInDate);
  const policy = CANCELLATION_POLICIES[policyKey];
  
  if (policyKey === 'non_refundable') {
    return ['This booking is non-refundable'];
  }

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
  const lastCutoff = policy.rules.find(r => r.daysBeforeCheckIn > 0 && r.refundPercentage === 0) 
    || policy.rules.find(r => r.refundPercentage === 0);
  
  if (lastCutoff && lastCutoff.daysBeforeCheckIn > 0) {
    const noRefundDate = new Date(checkInDate);
    noRefundDate.setDate(noRefundDate.getDate() - lastCutoff.daysBeforeCheckIn);
    summaryLines.push(`No refund after ${noRefundDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  } else {
    // For flexible/moderate, add the final no refund period
    const minDays = Math.min(...policy.rules.filter(r => r.refundPercentage > 0).map(r => r.daysBeforeCheckIn));
    if (minDays > 0) {
      summaryLines.push(`No refund within ${minDays} days of check-in`);
    }
  }

  return summaryLines;
}

/**
 * Get badge color class based on policy
 */
export function getPolicyBadgeClass(policyKey: CancellationPolicyKey): string {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  
  const policy = CANCELLATION_POLICIES[policyKey];
  return colorMap[policy.color] || colorMap.yellow;
}
