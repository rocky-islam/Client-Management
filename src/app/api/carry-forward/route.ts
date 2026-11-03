import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { carryForwardSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where: any = {
      userId: user.id,
      assignmentType: 'CARRY_FORWARD',
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const history = await prisma.projectMonth.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            orderId: true,
            value: true,
            orderStatus: true,
            deadline: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Carry forward GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch carry forward history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = carryForwardSchema.parse(body);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: validated.projectId, userId: user.id, isDeleted: false },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if target month and year already has an assignment for this project
    const existingTargetAssignment = await prisma.projectMonth.findFirst({
      where: {
        projectId: validated.projectId,
        month: validated.toMonth,
        year: validated.toYear,
      },
    });

    if (existingTargetAssignment) {
      if (existingTargetAssignment.isActive) {
        return NextResponse.json(
          { error: `This project is already assigned to Month ${validated.toMonth}/${validated.toYear}.` },
          { status: 400 }
        );
      } else {
        // Reactivate if it was previously removed
        const reactivated = await prisma.projectMonth.update({
          where: { id: existingTargetAssignment.id },
          data: {
            isActive: true,
            assignmentType: 'CARRY_FORWARD',
            fromMonth: validated.fromMonth,
            fromYear: validated.fromYear,
            toMonth: validated.toMonth,
            toYear: validated.toYear,
            carryForwardDate: new Date(),
            carryForwardReason: validated.reason,
            previousStatus: project.orderStatus,
            remark: validated.remark || null,
          },
        });

        await logActivity({
          userId: user.id,
          actionType: 'CARRIED_FORWARD',
          entityType: 'PROJECT',
          entityId: project.id,
          description: `Carried forward "${project.name}" (${project.orderId}) from ${validated.fromMonth}/${validated.fromYear} to ${validated.toMonth}/${validated.toYear}. Reason: ${validated.reason}`,
        });

        return NextResponse.json({ success: true, assignment: reactivated });
      }
    }

    // Atomic transaction creating the new monthly assignment WITHOUT duplicating the project
    const newAssignment = await prisma.$transaction(async (tx) => {
      const assignment = await tx.projectMonth.create({
        data: {
          userId: user.id,
          projectId: project.id,
          month: validated.toMonth,
          year: validated.toYear,
          assignmentType: 'CARRY_FORWARD',
          fromMonth: validated.fromMonth,
          fromYear: validated.fromYear,
          toMonth: validated.toMonth,
          toYear: validated.toYear,
          carryForwardDate: new Date(),
          carryForwardReason: validated.reason,
          previousStatus: project.orderStatus,
          remark: validated.remark || null,
          isActive: true,
        },
      });

      return assignment;
    });

    await logActivity({
      userId: user.id,
      actionType: 'CARRIED_FORWARD',
      entityType: 'PROJECT',
      entityId: project.id,
      description: `Carried forward "${project.name}" (${project.orderId}) from ${validated.fromMonth}/${validated.fromYear} to ${validated.toMonth}/${validated.toYear}. Reason: ${validated.reason}`,
    });

    return NextResponse.json({ success: true, assignment: newAssignment }, { status: 201 });
  } catch (error: any) {
    console.error('Carry forward POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to carry forward project' },
      { status: 400 }
    );
  }
}
