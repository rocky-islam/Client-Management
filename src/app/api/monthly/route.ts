import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isOverdue } from '@/lib/calculations';
import { MONTH_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    // Fetch all active assignments for this year
    const assignments = await prisma.projectMonth.findMany({
      where: {
        userId: user.id,
        year,
        isActive: true,
      },
      include: {
        project: {
          include: {
            payments: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    });

    // Fetch payments received in this year to compute monthly actual revenue
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        paymentDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Build stats for each month 1 to 12
    const monthsData = Array.from({ length: 12 }, (_, index) => {
      const monthNum = index + 1;
      const monthAssignments = assignments.filter((a) => a.month === monthNum && !a.project.isDeleted);

      let totalProjects = monthAssignments.length;
      let originalProjects = 0;
      let carryForwardProjects = 0;
      let deliveredProjects = 0;
      let wipProjects = 0;
      let cancelledProjects = 0;
      let overdueProjects = 0;
      let totalValue = 0;

      for (const assignment of monthAssignments) {
        const prj = assignment.project;
        if (assignment.assignmentType === 'CARRY_FORWARD') {
          carryForwardProjects++;
        } else {
          originalProjects++;
        }

        if (prj.orderStatus === 'DELIVERED') {
          deliveredProjects++;
        } else if (prj.orderStatus === 'CANCELLED') {
          cancelledProjects++;
        } else {
          wipProjects++;
        }

        if (isOverdue(prj.deadline, prj.orderStatus)) {
          overdueProjects++;
        }

        totalValue += Number(prj.value || 0);
      }

      // Actual revenue received from payments in this month
      const monthPayments = payments.filter((p) => {
        const pDate = new Date(p.paymentDate);
        return pDate.getFullYear() === year && pDate.getMonth() + 1 === monthNum;
      });

      const actualRevenue = monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      return {
        month: monthNum,
        name: MONTH_NAMES[index],
        year,
        totalProjects,
        originalProjects,
        carryForwardProjects,
        deliveredProjects,
        wipProjects,
        cancelledProjects,
        overdueProjects,
        totalValue,
        actualRevenue,
      };
    });

    return NextResponse.json({ year, months: monthsData });
  } catch (error: any) {
    console.error('Monthly overview GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch monthly overview' }, { status: 500 });
  }
}
