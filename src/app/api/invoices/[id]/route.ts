import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        client: true,
        project: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Invoice GET [id] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        paymentStatus: body.paymentStatus || existing.paymentStatus,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'INVOICE_UPDATED',
      entityType: 'INVOICE',
      entityId: updated.id,
      description: `Updated status of invoice ${updated.invoiceNumber} to ${updated.paymentStatus}`,
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error('Invoice PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}
