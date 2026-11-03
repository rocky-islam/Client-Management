import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();

    // Export all records belonging to the authenticated user
    const [
      clients,
      projects,
      projectMonths,
      payments,
      expenses,
      targets,
      tasks,
      invoices,
    ] = await Promise.all([
      prisma.client.findMany({ where: { userId: user.id } }),
      prisma.project.findMany({ where: { userId: user.id } }),
      prisma.projectMonth.findMany({ where: { userId: user.id } }),
      prisma.payment.findMany({ where: { userId: user.id } }),
      prisma.expense.findMany({ where: { userId: user.id } }),
      prisma.target.findMany({ where: { userId: user.id } }),
      prisma.projectTask.findMany({ where: { userId: user.id } }),
      prisma.invoice.findMany({ where: { userId: user.id } }),
    ]);

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userEmail: user.email,
      data: {
        clients,
        projects,
        projectMonths,
        payments,
        expenses,
        targets,
        tasks,
        invoices,
      },
    };

    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rocky-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Backup export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export backup' }, { status: 500 });
  }
}
