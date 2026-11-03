import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { taskSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = { userId: user.id };
    if (projectId) where.projectId = projectId;
    if (status && status !== 'ALL') where.status = status;

    const tasks = await prisma.projectTask.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, orderId: true } },
        subTasks: true,
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = taskSchema.parse(body);

    const task = await prisma.projectTask.create({
      data: {
        userId: user.id,
        projectId: validated.projectId,
        parentTaskId: validated.parentTaskId || null,
        name: validated.name.trim(),
        description: validated.description || null,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        priority: validated.priority,
        status: validated.status,
        progress: validated.progress,
        remark: validated.remark || null,
      },
      include: {
        project: true,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      description: `Created task "${task.name}" for project "${task.project.name}"`,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    console.error('Task POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to create task' },
      { status: 400 }
    );
  }
}
