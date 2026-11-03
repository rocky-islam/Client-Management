import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isOverdue, calculateAchievement, calculateOutstandingAmount } from '@/lib/calculations';
import { MONTH_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'THIS_YEAR'; // TODAY, THIS_WEEK, THIS_MONTH, THIS_YEAR, ALL

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Fetch all user projects (not deleted)
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      include: {
        client: { select: { id: true, name: true, companyName: true } },
        payments: { where: { status: 'COMPLETED' } },
        monthlyAssignments: { where: { isActive: true } },
      },
      orderBy: { projectDate: 'desc' },
    });

    // Fetch all completed payments
    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Fetch all expenses
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
    });

    // 1. KPI Calculations
    let totalProjects = projects.length;
    let activeProjects = 0;
    let deliveredProjects = 0;
    let wipProjects = 0;
    let cancelledProjects = 0;
    let overdueCount = 0;
    let totalProjectValue = 0;

    const overdueList: any[] = [];
    const upcomingDeadlines: any[] = [];
    const recentlyDelivered: any[] = [];

    for (const prj of projects) {
      totalProjectValue += Number(prj.value || 0);

      const isPrjOverdue = isOverdue(prj.deadline, prj.orderStatus);
      if (isPrjOverdue) {
        overdueCount++;
        overdueList.push(prj);
      }

      if (prj.orderStatus === 'DELIVERED') {
        deliveredProjects++;
        recentlyDelivered.push(prj);
      } else if (prj.orderStatus === 'CANCELLED') {
        cancelledProjects++;
      } else {
        activeProjects++;
        if (prj.orderStatus === 'WIP') wipProjects++;
        // Check if deadline is within next 7 days
        const diff = (new Date(prj.deadline).getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (diff >= 0 && diff <= 14) {
          upcomingDeadlines.push(prj);
        }
      }
    }

    // Sort upcoming deadlines ascending
    upcomingDeadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    recentlyDelivered.sort((a, b) => new Date(b.actualDeliveryDate || b.updatedAt).getTime() - new Date(a.actualDeliveryDate || a.updatedAt).getTime());

    // 2. Financial Totals
    const totalReceivedRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalReceivedRevenue - totalExpenses;
    const outstandingPayments = Math.max(0, totalProjectValue - totalReceivedRevenue);

    // Current Month Revenue
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const currentMonthPayments = payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d >= startOfCurrentMonth && d <= endOfCurrentMonth;
    });
    const monthlyRevenue = currentMonthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    // Current Month Target
    const monthlyTargetObj = await prisma.target.findFirst({
      where: {
        userId: user.id,
        year: currentYear,
        month: currentMonth,
        targetType: 'MONTHLY_REVENUE',
      },
    });
    const monthlyTarget = monthlyTargetObj ? Number(monthlyTargetObj.targetAmount) : 0;
    const targetAchievement = calculateAchievement(monthlyRevenue, monthlyTarget);

    // 3. Last 12 Months Revenue & Value Chart
    const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mStart = new Date(currentYear, i, 1);
      const mEnd = new Date(currentYear, i + 1, 0, 23, 59, 59);

      const mPayments = payments.filter((p) => {
        const d = new Date(p.paymentDate);
        return d >= mStart && d <= mEnd;
      });
      const revenue = mPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

      // Booked project value in that month
      const mProjects = projects.filter((p) => {
        const d = new Date(p.projectDate);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === m;
      });
      const bookedValue = mProjects.reduce((s, p) => s + Number(p.value || 0), 0);

      return {
        month: MONTH_NAMES[i].substring(0, 3),
        revenue,
        bookedValue,
      };
    });

    // 4. Project Status Distribution
    const statusCounts: Record<string, number> = {};
    for (const prj of projects) {
      statusCounts[prj.orderStatus] = (statusCounts[prj.orderStatus] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // 5. Source Performance
    const sourceData: Record<string, { count: number; totalValue: number }> = {};
    for (const prj of projects) {
      const src = prj.projectSource || 'Other';
      if (!sourceData[src]) sourceData[src] = { count: 0, totalValue: 0 };
      sourceData[src].count++;
      sourceData[src].totalValue += Number(prj.value || 0);
    }
    const sourcePerformance = Object.entries(sourceData).map(([source, stats]) => ({
      source,
      count: stats.count,
      totalValue: stats.totalValue,
      avgValue: stats.count > 0 ? Math.round(stats.totalValue / stats.count) : 0,
    }));

    // 6. New vs Repeat Clients
    let newOrderCount = 0;
    let repeatOrderCount = 0;
    for (const prj of projects) {
      if (prj.salesType === 'REPEAT_ORDER') repeatOrderCount++;
      else newOrderCount++;
    }

    return NextResponse.json({
      kpis: {
        totalProjects,
        activeProjects,
        deliveredProjects,
        wipProjects,
        cancelledProjects,
        overdueProjects: overdueCount,
        totalProjectValue,
        totalReceivedRevenue,
        outstandingPayments,
        monthlyRevenue,
        monthlyTarget,
        targetAchievement,
        totalExpenses,
        netProfit,
      },
      charts: {
        monthlyRevenue: monthlyChartData,
        statusDistribution,
        sourcePerformance,
        newVsRepeat: [
          { name: 'New Orders', value: newOrderCount },
          { name: 'Repeat Orders', value: repeatOrderCount },
        ],
      },
      recentProjects: projects.slice(0, 6),
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      overdueProjects: overdueList.slice(0, 5),
      recentlyDelivered: recentlyDelivered.slice(0, 5),
      recentPayments: payments.slice(0, 6),
    });
  } catch (error: any) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
