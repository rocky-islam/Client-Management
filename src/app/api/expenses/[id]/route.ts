import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const existing = await prisma.expense.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: user.id,
      actionType: 'EXPENSE_DELETED',
      entityType: 'EXPENSE',
      entityId: existing.id,
      description: `Deleted expense "${existing.title}" (${existing.amount})`,
    });

    return NextResponse.json({ success: true, message: 'Expense deleted' });
  } catch (error: any) {
    console.error('Expense DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status: 500 });
  }
}
