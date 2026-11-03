import { differenceInCalendarDays, isAfter, isBefore, startOfDay } from 'date-fns';

export interface TimeLeftResult {
  text: string;
  isOverdue: boolean;
  daysRemaining: number;
  daysOverdue: number;
  badgeColor: string;
}

/**
 * Dynamically calculates remaining time or overdue status.
 * Never stored permanently in the database.
 */
export function calculateTimeLeft(
  deadlineInput: Date | string,
  orderStatus: string,
  actualDeliveryDate?: Date | string | null
): TimeLeftResult {
  if (orderStatus === 'DELIVERED') {
    return {
      text: 'Delivered',
      isOverdue: false,
      daysRemaining: 0,
      daysOverdue: 0,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    };
  }

  if (orderStatus === 'CANCELLED') {
    return {
      text: 'Cancelled',
      isOverdue: false,
      daysRemaining: 0,
      daysOverdue: 0,
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    };
  }

  const deadline = new Date(deadlineInput);
  const today = startOfDay(new Date());
  const targetDay = startOfDay(deadline);

  const diffDays = differenceInCalendarDays(targetDay, today);

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: `${overdueDays}d overdue`,
      isOverdue: true,
      daysRemaining: diffDays,
      daysOverdue: overdueDays,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-semibold',
    };
  }

  if (diffDays === 0) {
    return {
      text: 'Due Today',
      isOverdue: false,
      daysRemaining: 0,
      daysOverdue: 0,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-medium',
    };
  }

  if (diffDays === 1) {
    return {
      text: '1 day left',
      isOverdue: false,
      daysRemaining: 1,
      daysOverdue: 0,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    };
  }

  return {
    text: `${diffDays} days left`,
    isOverdue: false,
    daysRemaining: diffDays,
    daysOverdue: 0,
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
}

export function isOverdue(deadline: Date | string, orderStatus: string): boolean {
  if (orderStatus === 'DELIVERED' || orderStatus === 'CANCELLED') return false;
  const targetDay = startOfDay(new Date(deadline));
  const today = startOfDay(new Date());
  return isBefore(targetDay, today);
}

export function calculateOutstandingAmount(
  projectValue: number,
  advancePayment: number = 0,
  payments: Array<{ amount: number | any; status: string }> = []
): { totalReceived: number; outstanding: number; paymentStatus: string } {
  const completedPaymentsTotal = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalReceived = Number(advancePayment || 0) + completedPaymentsTotal;
  const outstanding = Math.max(0, Number(projectValue || 0) - totalReceived);

  let paymentStatus = 'UNPAID';
  if (totalReceived >= Number(projectValue || 0) && Number(projectValue || 0) > 0) {
    paymentStatus = 'PAID';
  } else if (totalReceived > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  }

  return {
    totalReceived,
    outstanding,
    paymentStatus,
  };
}

export function calculateAchievement(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(999, Math.round((actual / target) * 100));
}

