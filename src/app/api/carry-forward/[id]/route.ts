import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const assignment = await prisma.projectMonth.findFirst({
      where: { id: params.id, userId: user.id },
      include: { project: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Monthly assignment not found' }, { status: 404 });
    }

    // Deactivate the assignment without deleting the project
    await prisma.projectMonth.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logActivity({
      userId: user.id,
      actionType: 'REMOVED_FROM_MONTH',
      entityType: 'PROJECT',
      entityId: assignment.projectId,
      description: `Removed "${assignment.project.name}" (${assignment.project.orderId}) from Month ${assignment.month}/${assignment.year}. Project record was preserved.`,
    });

    return NextResponse.json({
      success: true,
      message: `Project removed from month ${assignment.month}/${assignment.year}`,
    });
  } catch (error: any) {
    console.error('Carry forward DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove assignment' }, { status: 500 });
  }
}

