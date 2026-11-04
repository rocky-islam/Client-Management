import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { projectSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isMasterOrAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
    const where: any = { id: params.id };
    if (!isMasterOrAdmin) where.userId = user.id;

    const project = await prisma.project.findFirst({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        client: true,
        monthlyAssignments: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Project GET [id] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isMasterOrAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
    const body = await request.json();

    const existingProject = await prisma.project.findFirst({
      where: isMasterOrAdmin ? { id: params.id } : { id: params.id, userId: user.id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const validated = projectSchema.parse(body);

    // If orderId was changed, check for conflict
    if (validated.orderId !== existingProject.orderId) {
      const conflict = await prisma.project.findFirst({
        where: {
          userId: user.id,
          orderId: validated.orderId.trim(),
          id: { not: params.id },
          isDeleted: false,
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Order ID "${validated.orderId}" is already used by another project.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        clientId: validated.clientId,
        name: validated.name.trim(),
        orderId: validated.orderId.trim(),
        projectDate: new Date(validated.projectDate),
        category: validated.category,
        profileName: validated.profileName,
        projectSource: validated.projectSource,
        description: validated.description || null,
        value: validated.value,
        currency: validated.currency,
        advancePayment: validated.advancePayment || 0,
        startDate: new Date(validated.startDate),
        deliveryStatementDate: validated.deliveryStatementDate ? new Date(validated.deliveryStatementDate) : null,
        deadline: new Date(validated.deadline),
        actualDeliveryDate: validated.actualDeliveryDate ? new Date(validated.actualDeliveryDate) : null,
        estimatedDuration: validated.estimatedDuration || null,
        salesType: validated.salesType,
        orderStatus: validated.orderStatus,
        priority: validated.priority,
        progressPercentage: validated.progressPercentage,
        remark: validated.remark || null,
        internalNotes: validated.internalNotes || null,
        attachments: validated.attachments || null,
      },
      include: {
        client: true,
      },
    });

    // Check what important fields changed and log
    const changedDetails: string[] = [];
    if (existingProject.orderStatus !== updated.orderStatus) {
      changedDetails.push(`Status changed from ${existingProject.orderStatus} to ${updated.orderStatus}`);
    }
    if (new Date(existingProject.deadline).toISOString() !== new Date(updated.deadline).toISOString()) {
      changedDetails.push(`Deadline changed to ${updated.deadline.toISOString().split('T')[0]}`);
    }
    if (Number(existingProject.value) !== Number(updated.value)) {
      changedDetails.push(`Value changed from ${existingProject.value} to ${updated.value}`);
    }

    await logActivity({
      userId: user.id,
      actionType: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: updated.id,
      description: `Updated project "${updated.name}" (${updated.orderId})${
        changedDetails.length > 0 ? ': ' + changedDetails.join(', ') : ''
      }`,
      oldValues: existingProject,
      newValues: updated,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('Project PUT error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to update project' },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isMasterOrAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
    const body = await request.json();

    const existingProject = await prisma.project.findFirst({
      where: isMasterOrAdmin ? { id: params.id } : { id: params.id, userId: user.id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};

    if (body.orderStatus !== undefined) {
      dataToUpdate.orderStatus = body.orderStatus;
      if (body.orderStatus === 'DELIVERED') {
        dataToUpdate.actualDeliveryDate = new Date();
        dataToUpdate.progressPercentage = 100;
        if (!existingProject.deliveryStatementDate) {
          dataToUpdate.deliveryStatementDate = new Date();
        }
      }
    }

    if (body.deliveryStatementDate !== undefined) {
      dataToUpdate.deliveryStatementDate = body.deliveryStatementDate ? new Date(body.deliveryStatementDate) : null;
    }

    if (body.deadline !== undefined) {
      dataToUpdate.deadline = new Date(body.deadline);
    }

    if (body.remark !== undefined) {
      dataToUpdate.remark = body.remark || null;
    }

    if (body.priority !== undefined) {
      dataToUpdate.priority = body.priority;
    }

    if (body.progressPercentage !== undefined) {
      dataToUpdate.progressPercentage = Math.min(100, Math.max(0, Number(body.progressPercentage)));
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        client: true,
      },
    });

    const changeDescription = body.deadline
      ? `Updated deadline for project "${updated.name}" (${updated.orderId}) to ${new Date(body.deadline).toISOString().split('T')[0]}`
      : body.deliveryStatementDate !== undefined
      ? `Updated delivery statement date for project "${updated.name}" (${updated.orderId})`
      : `Quick updated project "${updated.name}" (${updated.orderId}) to status: ${updated.orderStatus}`;

    await logActivity({
      userId: user.id,
      actionType: body.orderStatus ? 'STATUS_CHANGED' : 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: updated.id,
      description: changeDescription,
      oldValues: existingProject,
      newValues: updated,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('Project PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to patch project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const isMasterOrAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
    const existing = await prisma.project.findFirst({
      where: isMasterOrAdmin ? { id: params.id } : { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Soft delete
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });

    await logActivity({
      userId: user.id,
      actionType: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: existing.id,
      description: `Soft-deleted project "${existing.name}" (Order ID: ${existing.orderId})`,
    });

    return NextResponse.json({ success: true, message: 'Project moved to trash' });
  } catch (error: any) {
    console.error('Project DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete project' }, { status: 500 });
  }
}

