import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { projectSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const profile = searchParams.get('profile');
    const source = searchParams.get('source');
    const salesType = searchParams.get('salesType');
    const archived = searchParams.get('archived') === 'true';
    const deleted = searchParams.get('deleted') === 'true';
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    const where: any = {
      userId: user.id,
      isArchived: archived,
      isDeleted: deleted,
    };

    if (status && status !== 'ALL') {
      where.orderStatus = status;
    }

    if (profile && profile !== 'ALL') {
      where.profileName = profile;
    }

    if (source && source !== 'ALL') {
      where.projectSource = source;
    }

    if (salesType && salesType !== 'ALL') {
      where.salesType = salesType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
        { remark: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by monthly assignment if specified
    if (year !== undefined && month !== undefined) {
      where.monthlyAssignments = {
        some: {
          year,
          month,
          isActive: true,
        },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: true },
        },
        monthlyAssignments: {
          where: { isActive: true },
          orderBy: { year: 'desc' },
        },
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { projectDate: 'desc' },
      ],
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Projects GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = projectSchema.parse(body);

    // Verify orderId uniqueness for this user
    const existing = await prisma.project.findFirst({
      where: {
        userId: user.id,
        orderId: validated.orderId.trim(),
        isDeleted: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A project with Order ID "${validated.orderId}" already exists.` },
        { status: 400 }
      );
    }

    // Use Prisma transaction to ensure Project, Monthly Assignment, and optional Advance Payment are created atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create project
      const project = await tx.project.create({
        data: {
          userId: user.id,
          clientId: validated.clientId,
          name: validated.name.trim(),
          orderId: validated.orderId.trim(),
          projectDate: new Date(validated.projectDate),
          category: validated.category,
          profileName: validated.profileName,
          projectSource: validated.projectSource,
          description: validated.description || null,
          value: validated.value,
          currency: validated.currency || user.defaultCurrency || 'USD',
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

      // 2. Create initial Original Monthly Assignment
      const monthAssignment = await tx.projectMonth.create({
        data: {
          userId: user.id,
          projectId: project.id,
          month: validated.assignedMonth,
          year: validated.assignedYear,
          assignmentType: 'ORIGINAL',
          remark: 'Initial original assignment',
        },
      });

      // 3. If advance payment provided > 0, record payment transaction
      if (validated.advancePayment && validated.advancePayment > 0) {
        await tx.payment.create({
          data: {
            userId: user.id,
            projectId: project.id,
            clientId: validated.clientId,
            amount: validated.advancePayment,
            currency: project.currency,
            paymentDate: new Date(validated.startDate),
            paymentMethod: validated.profileName.toUpperCase().replace(/\s+/g, '_') || 'BANK_TRANSFER',
            transactionRef: `ADV-${project.orderId}`,
            status: 'COMPLETED',
            remark: 'Advance payment received on project order.',
          },
        });
      }

      return { project, monthAssignment };
    });

    // Log Activity
    await logActivity({
      userId: user.id,
      actionType: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: result.project.id,
      description: `Created project "${result.project.name}" (Order ID: ${result.project.orderId}) for client "${result.project.client.name}" with value $${result.project.value}`,
      newValues: result.project,
    });

    return NextResponse.json({ success: true, project: result.project }, { status: 201 });
  } catch (error: any) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to create project' },
      { status: 400 }
    );
  }
}
