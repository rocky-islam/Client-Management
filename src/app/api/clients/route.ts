import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { clientSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = {
      userId: user.id,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        projects: {
          where: { isDeleted: false },
          select: {
            id: true,
            value: true,
            orderStatus: true,
            projectDate: true,
            advancePayment: true,
            payments: {
              where: { status: 'COMPLETED' },
              select: { amount: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute client lifetime aggregates
    const clientsWithStats = clients.map((c) => {
      const totalOrders = c.projects.length;
      let totalValue = 0;
      let totalReceived = 0;
      let firstOrderDate: Date | null = null;

      for (const prj of c.projects) {
        totalValue += Number(prj.value || 0);
        const paymentsSum = prj.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
        totalReceived += Number(prj.advancePayment || 0) + paymentsSum;

        if (!firstOrderDate || new Date(prj.projectDate) < firstOrderDate) {
          firstOrderDate = new Date(prj.projectDate);
        }
      }

      const outstanding = Math.max(0, totalValue - totalReceived);
      const isRepeatClient = totalOrders > 1;

      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        country: c.country,
        contactInfo: c.contactInfo,
        profileLink: c.profileLink,
        clientStatus: c.clientStatus,
        notes: c.notes,
        totalOrders,
        totalValue,
        totalReceived,
        outstanding,
        firstOrderDate,
        isRepeatClient,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ clients: clientsWithStats });
  } catch (error: any) {
    console.error('Clients GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = clientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: validated.name.trim(),
        companyName: validated.companyName?.trim() || null,
        email: validated.email?.trim() || null,
        country: validated.country?.trim() || null,
        contactInfo: validated.contactInfo?.trim() || null,
        profileLink: validated.profileLink?.trim() || null,
        clientStatus: validated.clientStatus,
        notes: validated.notes || null,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'CLIENT_CREATED',
      entityType: 'CLIENT',
      entityId: client.id,
      description: `Created new client "${client.name}" ${client.companyName ? `(${client.companyName})` : ''}`,
      newValues: client,
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    console.error('Client POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to create client' },
      { status: 400 }
    );
  }
}
