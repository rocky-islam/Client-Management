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

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { isDeleted: false },
    });

    await logActivity({
      userId: user.id,
      actionType: 'PROJECT_RESTORED',
      entityType: 'PROJECT',
      entityId: existing.id,
      description: `Restored project "${existing.name}" (${existing.orderId}) from trash`,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('Project restore error:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore project' }, { status: 500 });
  }
}

