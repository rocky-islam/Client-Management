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
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const nextArchivedState = !existing.isArchived;
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { isArchived: nextArchivedState },
    });

    await logActivity({
      userId: user.id,
      actionType: nextArchivedState ? 'PROJECT_ARCHIVED' : 'PROJECT_UNARCHIVED',
      entityType: 'PROJECT',
      entityId: existing.id,
      description: `${nextArchivedState ? 'Archived' : 'Unarchived'} project "${existing.name}" (${existing.orderId})`,
    });

    return NextResponse.json({ success: true, isArchived: updated.isArchived });
  } catch (error: any) {
    console.error('Project archive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to toggle archive' }, { status: 500 });
  }
}
