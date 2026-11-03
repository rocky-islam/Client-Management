import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { paymentSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    const where: any = { userId: user.id };

    if (projectId) where.projectId = projectId;
    if (clientId) where.clientId = clientId;

    if (year !== undefined) {
      const start = month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
      const end = month !== undefined ? new Date(year, month, 0, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59);
      where.paymentDate = { gte: start, lte: end };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, orderId: true, value: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalRevenue = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    return NextResponse.json({ payments, totalRevenue });
  } catch (error: any) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = paymentSchema.parse(body);

    const project = await prisma.project.findFirst({
      where: { id: validated.projectId, userId: user.id },
      include: { client: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          userId: user.id,
          projectId: project.id,
          clientId: project.clientId,
          amount: validated.amount,
          currency: validated.currency || project.currency,
          paymentDate: new Date(validated.paymentDate),
          paymentMethod: validated.paymentMethod,
          transactionRef: validated.transactionRef || null,
          status: 'COMPLETED',
          remark: validated.remark || null,
        },
      });

      return p;
    });

    await logActivity({
      userId: user.id,
      actionType: 'PAYMENT_ADDED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Recorded payment of ${payment.currency} ${payment.amount} via ${payment.paymentMethod} for project "${project.name}" (${project.orderId})`,
      newValues: payment,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    console.error('Payment POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}
