import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const ids: string[] = body.ids || [];
    const action: string = body.action;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No project IDs provided' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Verify ownership of the projects
    const existingProjects = await prisma.project.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        orderId: true,
        deadline: true,
        orderStatus: true,
        deliveryStatementDate: true,
      },
    });

    if (existingProjects.length === 0) {
      return NextResponse.json({ error: 'No valid projects found to update' }, { status: 404 });
    }

    const validIds = existingProjects.map((p) => p.id);

    // 1. BATCH UPDATE STATUS
    if (action === 'UPDATE_STATUS') {
      const newStatus = body.payload?.orderStatus;
      if (!newStatus) {
        return NextResponse.json({ error: 'New status is required' }, { status: 400 });
      }

      const updateData: any = { orderStatus: newStatus };
      if (newStatus === 'DELIVERED') {
        updateData.actualDeliveryDate = new Date();
        updateData.progressPercentage = 100;
      }

      await prisma.project.updateMany({
        where: {
          id: { in: validIds },
          userId: user.id,
        },
        data: updateData,
      });

      // If marked delivered, update delivery statement date if null
      if (newStatus === 'DELIVERED') {
        await prisma.project.updateMany({
          where: {
            id: { in: validIds },
            userId: user.id,
            deliveryStatementDate: null,
          },
          data: {
            deliveryStatementDate: new Date(),
          },
        });
      }

      await logActivity({
        userId: user.id,
        actionType: 'STATUS_CHANGED',
        entityType: 'PROJECT',
        entityId: validIds[0],
        description: `Batch updated ${validIds.length} projects to status "${newStatus}"`,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${validIds.length} projects to ${newStatus}`,
        updatedCount: validIds.length,
      });
    }

    // 2. BATCH EXTEND DEADLINE BY DAYS
    if (action === 'EXTEND_DEADLINE') {
      const daysToAdd = parseInt(body.payload?.daysToAdd);
      if (isNaN(daysToAdd) || daysToAdd <= 0) {
        return NextResponse.json({ error: 'Valid days to add is required' }, { status: 400 });
      }

      for (const p of existingProjects) {
        const current = new Date(p.deadline);
        current.setDate(current.getDate() + daysToAdd);
        await prisma.project.update({
          where: { id: p.id },
          data: { deadline: current },
        });
      }

      await logActivity({
        userId: user.id,
        actionType: 'PROJECT_UPDATED',
        entityType: 'PROJECT',
        entityId: validIds[0],
        description: `Batch extended deadlines for ${validIds.length} projects by +${daysToAdd} days`,
      });

      return NextResponse.json({
        success: true,
        message: `Extended deadlines for ${validIds.length} projects by +${daysToAdd} days`,
        updatedCount: validIds.length,
      });
    }

    // 3. BATCH SET EXACT DEADLINE
    if (action === 'SET_DEADLINE') {
      const newDeadline = body.payload?.deadline;
      if (!newDeadline) {
        return NextResponse.json({ error: 'New deadline date is required' }, { status: 400 });
      }

      await prisma.project.updateMany({
        where: {
          id: { in: validIds },
          userId: user.id,
        },
        data: {
          deadline: new Date(newDeadline),
        },
      });

      await logActivity({
        userId: user.id,
        actionType: 'PROJECT_UPDATED',
        entityType: 'PROJECT',
        entityId: validIds[0],
        description: `Batch set deadline for ${validIds.length} projects to ${newDeadline}`,
      });

      return NextResponse.json({
        success: true,
        message: `Set deadline for ${validIds.length} projects`,
        updatedCount: validIds.length,
      });
    }

    // 4. BATCH MOVE TO TRASH / DELETE
    if (action === 'DELETE') {
      await prisma.project.updateMany({
        where: {
          id: { in: validIds },
          userId: user.id,
        },
        data: {
          isDeleted: true,
        },
      });

      await logActivity({
        userId: user.id,
        actionType: 'PROJECT_DELETED',
        entityType: 'PROJECT',
        entityId: validIds[0],
        description: `Batch soft-deleted ${validIds.length} projects`,
      });

      return NextResponse.json({
        success: true,
        message: `Moved ${validIds.length} projects to trash`,
        updatedCount: validIds.length,
      });
    }

    // 5. BATCH ARCHIVE
    if (action === 'ARCHIVE') {
      const isArchived = body.payload?.isArchived !== false;
      await prisma.project.updateMany({
        where: {
          id: { in: validIds },
          userId: user.id,
        },
        data: {
          isArchived,
        },
      });

      await logActivity({
        userId: user.id,
        actionType: 'PROJECT_UPDATED',
        entityType: 'PROJECT',
        entityId: validIds[0],
        description: `Batch ${isArchived ? 'archived' : 'unarchived'} ${validIds.length} projects`,
      });

      return NextResponse.json({
        success: true,
        message: `${isArchived ? 'Archived' : 'Unarchived'} ${validIds.length} projects`,
        updatedCount: validIds.length,
      });
    }

    return NextResponse.json({ error: `Unknown batch action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Batch projects error:', error);
    return NextResponse.json({ error: error.message || 'Batch action failed' }, { status: 500 });
  }
}
