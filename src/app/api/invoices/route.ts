import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { invoiceSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        client: { select: { id: true, name: true, companyName: true, email: true } },
        project: { select: { id: true, name: true, orderId: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = invoiceSchema.parse(body);

    // Calculate total from items
    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: validated.clientId,
        projectId: validated.projectId || null,
        invoiceNumber: validated.invoiceNumber.trim(),
        issueDate: new Date(validated.issueDate),
        dueDate: new Date(validated.dueDate),
        totalAmount,
        currency: validated.currency || user.defaultCurrency || 'USD',
        paymentStatus: validated.paymentStatus,
        notes: validated.notes || null,
        items: JSON.stringify(validated.items),
      },
      include: {
        client: true,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'INVOICE_CREATED',
      entityType: 'INVOICE',
      entityId: invoice.id,
      description: `Created invoice ${invoice.invoiceNumber} for client "${invoice.client.name}" totaling ${invoice.currency} ${invoice.totalAmount}`,
      newValues: invoice,
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Invoice POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to create invoice' },
      { status: 400 }
    );
  }
}
