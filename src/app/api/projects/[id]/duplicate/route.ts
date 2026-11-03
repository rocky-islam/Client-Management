import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const existing = await prisma.project.findFirst({
      where: { id: params.id, userId: user.id },
      include: { client: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const newOrderId = `${existing.orderId}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();

    const duplicated = await prisma.$transaction(async (tx) => {
      const prj = await tx.project.create({
        data: {
          userId: user.id,
          clientId: existing.clientId,
          name: `${existing.name} (Copy)`,
          orderId: newOrderId,
          projectDate: now,
          category: existing.category,
          profileName: existing.profileName,
          projectSource: existing.projectSource,
          description: existing.description,
          value: existing.value,
          currency: existing.currency,
          advancePayment: 0,
          startDate: now,
          deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 days
          salesType: 'REPEAT_ORDER',
          orderStatus: 'NEW',
          priority: existing.priority,
          progressPercentage: 0,
          remark: `Duplicated from ${existing.orderId}`,
        },
      });

      await tx.projectMonth.create({
        data: {
          userId: user.id,
          projectId: prj.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          assignmentType: 'ORIGINAL',
          remark: `Initial assignment for duplicated project`,
        },
      });

      return prj;
    });

    await logActivity({
      userId: user.id,
      actionType: 'PROJECT_DUPLICATED',
      entityType: 'PROJECT',
      entityId: duplicated.id,
      description: `Duplicated project "${existing.name}" into "${duplicated.name}" (${duplicated.orderId})`,
    });

    return NextResponse.json({ success: true, project: duplicated });
  } catch (error: any) {
    console.error('Project duplicate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to duplicate project' }, { status: 500 });
  }
}

