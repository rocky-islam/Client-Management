import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { expenseSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    const where: any = { userId: user.id };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (year !== undefined) {
      const start = month !== undefined ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
      const end = month !== undefined ? new Date(year, month, 0, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59);
      where.expenseDate = { gte: start, lte: end };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    return NextResponse.json({ expenses, totalExpenses });
  } catch (error: any) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        title: validated.title.trim(),
        category: validated.category,
        amount: validated.amount,
        currency: validated.currency || user.defaultCurrency || 'USD',
        expenseDate: new Date(validated.expenseDate),
        paymentMethod: validated.paymentMethod,
        remark: validated.remark || null,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'EXPENSE_ADDED',
      entityType: 'EXPENSE',
      entityId: expense.id,
      description: `Added expense "${expense.title}" of ${expense.currency} ${expense.amount} under ${expense.category}`,
      newValues: expense,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    console.error('Expense POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to add expense' },
      { status: 400 }
    );
  }
}
