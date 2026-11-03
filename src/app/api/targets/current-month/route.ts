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
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : now.getMonth() + 1;

    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(new Date(year, month - 1, 1));
    const today = new Date();
    const daysLeftInMonth = Math.max(0, differenceInCalendarDays(endDate, today));

    // Fetch Target, Payments, and Projects for this month in parallel
    const [targetRecord, monthPayments, deliveredProjects, bookedProjects] = await Promise.all([
      prisma.target.findFirst({
        where: {
          userId: user.id,
          year,
          month,
          targetType: 'MONTHLY_REVENUE',
        },
      }),
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
    const receivedRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const deliveredValue = deliveredProjects.reduce((sum, p) => sum + Number(p.value || 0), 0);
    const bookedValue = bookedProjects.reduce((sum, p) => sum + Number(p.value || 0), 0);

    // Primary achievement metric: Received Revenue (or Delivered Value if payments weren't logged separately)
    const achievedAmount = Math.max(receivedRevenue, deliveredValue);
    const targetAmount = targetRecord ? Number(targetRecord.targetAmount) : 5000; // default $5000 benchmark if not set
    const hasCustomTarget = !!targetRecord;
    const currency = targetRecord?.currency || user.defaultCurrency || 'USD';

    const percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
    const remaining = Math.max(0, targetAmount - achievedAmount);
    const monthName = MONTH_NAMES[month - 1] || 'Current Month';

    return NextResponse.json({
      year,
      month,
      monthName,
      targetAmount,
      achievedAmount,
      deliveredValue,
      bookedValue,
      receivedRevenue,
      remaining,
      percentage: Number(percentage.toFixed(1)),
      hasCustomTarget,
      currency,
      daysLeftInMonth,
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
    const month = body.month ? parseInt(body.month) : now.getMonth() + 1;
    const targetAmount = Number(body.targetAmount);

    if (isNaN(targetAmount) || targetAmount < 0) {
      return NextResponse.json({ error: 'Valid target amount is required' }, { status: 400 });
    }

    const currency = body.currency || user.defaultCurrency || 'USD';

    const target = await prisma.target.upsert({
      where: {
        userId_targetType_year_month_metricType: {
          userId: user.id,
          targetType: 'MONTHLY_REVENUE',
          year,
          month,
          metricType: 'RECEIVED_REVENUE',
        },
      },
      update: {
        targetAmount,
        currency,
      },
      create: {
        userId: user.id,
        targetType: 'MONTHLY_REVENUE',
        targetAmount,
        currency,
        year,
        month,
        metricType: 'RECEIVED_REVENUE',
      },
    });

    const monthName = MONTH_NAMES[month - 1] || 'Month';

    await logActivity({
      userId: user.id,
      actionType: 'TARGET_SET',
      entityType: 'TARGET',
      entityId: target.id,
      description: `Updated revenue goal for ${monthName} ${year} to ${currency} ${targetAmount}`,
      newValues: target,
    });

    return NextResponse.json({ success: true, target });
  } catch (error: any) {
    console.error('Target current-month POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save goal' }, { status: 500 });
  }
}

