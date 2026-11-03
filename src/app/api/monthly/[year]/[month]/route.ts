import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isOverdue, calculateAchievement, calculateOutstandingAmount } from '@/lib/calculations';
import { MONTH_NAMES } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: { year: string; month: string } }
) {
  try {
    const user = await requireAuth();
    const year = parseInt(params.year);
    const month = parseInt(params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Parallelize queries in a single round-trip
    const [assignments, payments, target] = await Promise.all([
      prisma.projectMonth.findMany({
        where: {
          userId: user.id,
          year,
          month,
          isActive: true,
        },
        include: {
          project: {
            include: {
              client: true,
              payments: {
                where: { status: 'COMPLETED' },
              },
              monthlyAssignments: {
                where: { isActive: true },
                orderBy: [{ year: 'asc' }, { month: 'asc' }],
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.target.findFirst({
        where: {
          userId: user.id,
          year,
          month,
          targetType: 'MONTHLY_REVENUE',
        },
      }),
    ]);

    const activeAssignments = assignments.filter((a) => !a.project.isDeleted);
    const actualMonthlyRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const targetAmount = target ? Number(target.targetAmount) : 0;
    const targetAchievement = calculateAchievement(actualMonthlyRevenue, targetAmount);

    let originalCount = 0;
    let carryForwardCount = 0;
    let deliveredCount = 0;
    let wipCount = 0;
    let cancelledCount = 0;
    let overdueCount = 0;
    let totalProjectValue = 0;
    let newOrdersCount = 0;
    let repeatOrdersCount = 0;

    const projectsList = activeAssignments.map((assignment) => {
      const prj = assignment.project;
      const { totalReceived, outstanding, paymentStatus } = calculateOutstandingAmount(
        Number(prj.value),
        Number(prj.advancePayment),
        prj.payments
      );

      const isPrjOverdue = isOverdue(prj.deadline, prj.orderStatus);

      if (assignment.assignmentType === 'CARRY_FORWARD') {
        carryForwardCount++;
      } else {
        originalCount++;
      }

      if (prj.orderStatus === 'DELIVERED') {
        deliveredCount++;
      } else if (prj.orderStatus === 'CANCELLED') {
        cancelledCount++;
      } else {
        wipCount++;
      }

      if (isPrjOverdue) {
        overdueCount++;
      }

      if (prj.salesType === 'REPEAT_ORDER') {
        repeatOrdersCount++;
      } else {
        newOrdersCount++;
      }

      totalProjectValue += Number(prj.value || 0);

      return {
        assignmentId: assignment.id,
        assignmentType: assignment.assignmentType,
        carryForwardReason: assignment.carryForwardReason,
        carryForwardDate: assignment.carryForwardDate,
        fromMonth: assignment.fromMonth,
        fromYear: assignment.fromYear,
        toMonth: assignment.toMonth,
        toYear: assignment.toYear,
        assignmentRemark: assignment.remark,
        // Project fields
        ...prj,
        totalReceived,
        outstanding,
        computedPaymentStatus: paymentStatus,
        isOverdue: isPrjOverdue,
      };
    });

    // Ensure newly created / added projects are always displayed at the top
    projectsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      year,
      month,
      monthName: MONTH_NAMES[month - 1],
      stats: {
        totalProjects: activeAssignments.length,
        originalCount,
        carryForwardCount,
        deliveredCount,
        wipCount,
        cancelledCount,
        overdueCount,
        totalProjectValue,
        actualMonthlyRevenue,
        targetAmount,
        targetAchievement,
        newOrdersCount,
        repeatOrdersCount,
      },
      projects: projectsList,
    });
  } catch (error: any) {
    console.error('Monthly detail GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch monthly details' }, { status: 500 });
  }
}

