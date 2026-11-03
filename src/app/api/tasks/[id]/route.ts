import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.projectTask.findFirst({
      where: { id: params.id, userId: user.id },
      include: { project: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updated = await prisma.projectTask.update({
      where: { id: params.id },
      data: {
        status: body.status || existing.status,
        progress: body.progress !== undefined ? body.progress : existing.progress,
        name: body.name || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: updated.id,
      description: `Updated task "${updated.name}" status to ${updated.status} (${updated.progress}%)`,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error('Task PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const existing = await prisma.projectTask.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.projectTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    console.error('Task DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}

