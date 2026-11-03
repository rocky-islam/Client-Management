import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { clientSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const client = await prisma.client.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        projects: {
          where: { isDeleted: false },
          include: {
            payments: { where: { status: 'COMPLETED' } },
          },
          orderBy: { projectDate: 'desc' },
        },
        payments: {
          where: { status: 'COMPLETED' },
          orderBy: { paymentDate: 'desc' },
          include: { project: { select: { name: true, orderId: true } } },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const totalOrders = client.projects.length;
    const totalValue = client.projects.reduce((s, p) => s + Number(p.value || 0), 0);
    const totalReceived = client.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, totalValue - totalReceived);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    return NextResponse.json({
      client: {
        ...client,
        stats: {
          totalOrders,
          totalValue,
          totalReceived,
          outstanding,
          averageOrderValue,
          isRepeatClient: totalOrders > 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Client GET [id] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const validated = clientSchema.parse(body);

    const updated = await prisma.client.update({
      where: { id: params.id },
      data: {
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
      actionType: 'CLIENT_UPDATED',
      entityType: 'CLIENT',
      entityId: updated.id,
      description: `Updated client "${updated.name}"`,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error('Client PUT error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to update client' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await prisma.client.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });

    await logActivity({
      userId: user.id,
      actionType: 'CLIENT_DELETED',
      entityType: 'CLIENT',
      entityId: existing.id,
      description: `Soft-deleted client "${existing.name}"`,
    });

    return NextResponse.json({ success: true, message: 'Client moved to trash' });
  } catch (error: any) {
    console.error('Client DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete client' }, { status: 500 });
  }
}
