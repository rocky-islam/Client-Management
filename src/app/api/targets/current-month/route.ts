import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { MONTH_NAMES } from '@/lib/constants';
import { differenceInCalendarDays, endOfMonth, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : currentMonthNum;
    const scope = (searchParams.get('scope') || 'monthly').toLowerCase(); // monthly | quarterly | yearly

    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let scopeTitle = '';
    let scopeSubtitle = '';
    let targetRecord: any = null;
    let defaultTarget = 5000;
    let quarter = Math.ceil(month / 3);

    if (scope === 'quarterly') {
      if (searchParams.get('quarter')) {
        quarter = parseInt(searchParams.get('quarter')!);
      }
      quarter = Math.min(4, Math.max(1, quarter));
      const qStartMonthIndex = (quarter - 1) * 3;
      const qEndMonthIndex = quarter * 3 - 1;
      startDate = startOfMonth(new Date(year, qStartMonthIndex, 1));
      endDate = endOfMonth(new Date(year, qEndMonthIndex, 1));
      const qRangeStr = `${MONTH_NAMES[qStartMonthIndex].substring(0, 3)} - ${MONTH_NAMES[qEndMonthIndex].substring(0, 3)}`;
      scopeTitle = `Q${quarter} ${year} (${qRangeStr}) Revenue Goal`;
      scopeSubtitle = `Quarterly target (3 months: ${qRangeStr})`;
      defaultTarget = 15000;

      // Look for custom QUARTERLY_REVENUE target
      targetRecord = await prisma.target.findFirst({
        where: {
          userId: user.id,
          year,
          month: quarter,
          targetType: 'QUARTERLY_REVENUE',
        },
      });

      // If no explicit quarterly target, check sum of 3 months' targets
      if (!targetRecord) {
        const monthTargets = await prisma.target.findMany({
          where: {
            userId: user.id,
            year,
            month: { in: [qStartMonthIndex + 1, qStartMonthIndex + 2, qStartMonthIndex + 3] },
            targetType: 'MONTHLY_REVENUE',
          },
        });
        if (monthTargets.length > 0) {
          const sumAmt = monthTargets.reduce((s, t) => s + Number(t.targetAmount || 0), 0);
          if (sumAmt > 0) {
            targetRecord = {
              targetAmount: sumAmt,
              currency: monthTargets[0].currency,
              isDerived: true,
            };
          }
        }
      }
    } else if (scope === 'yearly') {
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      scopeTitle = `${year} Annual Revenue Goal`;
      scopeSubtitle = `Full year target across all 12 months`;
      defaultTarget = 50000;

      // Look for custom YEARLY_REVENUE target
      targetRecord = await prisma.target.findFirst({
        where: {
          userId: user.id,
          year,
          month: 0,
          targetType: 'YEARLY_REVENUE',
        },
      });

      // If no explicit yearly target, check sum of all monthly targets
      if (!targetRecord) {
        const allMonthTargets = await prisma.target.findMany({
          where: {
            userId: user.id,
            year,
            targetType: 'MONTHLY_REVENUE',
          },
        });
        if (allMonthTargets.length > 0) {
          const sumAmt = allMonthTargets.reduce((s, t) => s + Number(t.targetAmount || 0), 0);
          if (sumAmt > 0) {
            targetRecord = {
              targetAmount: sumAmt,
              currency: allMonthTargets[0].currency,
              isDerived: true,
            };
          }
        }
      }
    } else {
      // Monthly scope
      startDate = startOfMonth(new Date(year, month - 1, 1));
      endDate = endOfMonth(new Date(year, month - 1, 1));
      const mName = MONTH_NAMES[month - 1] || 'Month';
      scopeTitle = `${mName} ${year} Revenue Goal`;
      scopeSubtitle = `Track progress towards your monthly business target`;
      defaultTarget = 5000;

      targetRecord = await prisma.target.findFirst({
        where: {
          userId: user.id,
          year,
          month,
          targetType: 'MONTHLY_REVENUE',
        },
      });
    }

    const daysLeft = Math.max(0, differenceInCalendarDays(endDate, today));

    // Fetch Payments and Delivered projects in this date range
    const [payments, deliveredProjects, bookedProjects] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { amount: true },
      }),
      prisma.project.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          orderStatus: 'DELIVERED',
          actualDeliveryDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { value: true },
      }),
      prisma.project.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          projectDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { value: true },
      }),
    ]);

    // Financial calculations
    const receivedRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const deliveredValue = deliveredProjects.reduce((sum, p) => sum + Number(p.value || 0), 0);
    const bookedValue = bookedProjects.reduce((sum, p) => sum + Number(p.value || 0), 0);

    const achievedAmount = Math.max(receivedRevenue, deliveredValue);
    const targetAmount = targetRecord ? Number(targetRecord.targetAmount) : defaultTarget;
    const hasCustomTarget = !!targetRecord && !targetRecord.isDerived;
    const currency = targetRecord?.currency || user.defaultCurrency || 'USD';

    const percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
    const remaining = Math.max(0, targetAmount - achievedAmount);
    const monthName = MONTH_NAMES[month - 1] || 'Current Month';

    return NextResponse.json({
      scope,
      year,
      month,
      quarter,
      monthName,
      scopeTitle,
      scopeSubtitle,
      targetAmount,
      achievedAmount,
      deliveredValue,
      bookedValue,
      receivedRevenue,
      remaining,
      percentage: Number(percentage.toFixed(1)),
      hasCustomTarget,
      currency,
      daysLeft,
    });
  } catch (error: any) {
    console.error('Target current-month GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const now = new Date();
    const year = body.year ? parseInt(body.year) : now.getFullYear();
    const targetAmount = Number(body.targetAmount);
    const scope = (body.scope || 'monthly').toLowerCase();

    if (isNaN(targetAmount) || targetAmount < 0) {
      return NextResponse.json({ error: 'Valid target amount is required' }, { status: 400 });
    }

    const currency = body.currency || user.defaultCurrency || 'USD';

    let targetType = 'MONTHLY_REVENUE';
    let monthVal = body.month ? parseInt(body.month) : now.getMonth() + 1;
    let label = '';

    if (scope === 'quarterly') {
      targetType = 'QUARTERLY_REVENUE';
      monthVal = body.quarter ? parseInt(body.quarter) : Math.ceil((now.getMonth() + 1) / 3);
      monthVal = Math.min(4, Math.max(1, monthVal));
      label = `Q${monthVal} ${year}`;
    } else if (scope === 'yearly') {
      targetType = 'YEARLY_REVENUE';
      monthVal = 0;
      label = `Year ${year}`;
    } else {
      targetType = 'MONTHLY_REVENUE';
      monthVal = Math.min(12, Math.max(1, monthVal));
      const mName = MONTH_NAMES[monthVal - 1] || 'Month';
      label = `${mName} ${year}`;
    }

    const target = await prisma.target.upsert({
      where: {
        userId_targetType_year_month_metricType: {
          userId: user.id,
          targetType,
          year,
          month: monthVal,
          metricType: 'RECEIVED_REVENUE',
        },
      },
      update: {
        targetAmount,
        currency,
      },
      create: {
        userId: user.id,
        targetType,
        targetAmount,
        currency,
        year,
        month: monthVal,
        metricType: 'RECEIVED_REVENUE',
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'TARGET_SET',
      entityType: 'TARGET',
      entityId: target.id,
      description: `Updated ${targetType} goal for ${label} to ${currency} ${targetAmount}`,
      newValues: target,
    });

    return NextResponse.json({ success: true, target });
  } catch (error: any) {
    console.error('Target current-month POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save goal' }, { status: 500 });
  }
}
