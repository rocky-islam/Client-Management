import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { targetSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const targetType = searchParams.get('targetType') || undefined;

    const where: any = { userId: user.id, year };
    if (month !== undefined) where.month = month;
    if (targetType) where.targetType = targetType;

    const targets = await prisma.target.findMany({
      where,
      orderBy: [{ month: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ targets });
  } catch (error: any) {
    console.error('Targets GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = targetSchema.parse(body);

    // Normalize month representation:
    // YEARLY_REVENUE -> month: 0
    // QUARTERLY_REVENUE -> month: 1..4 (Q1, Q2, Q3, Q4)
    // MONTHLY_REVENUE -> month: 1..12
    let monthVal = 0;
    if (validated.targetType === 'QUARTERLY_REVENUE') {
      monthVal = Math.min(4, Math.max(1, validated.month ?? 1));
    } else if (validated.targetType === 'MONTHLY_REVENUE') {
      monthVal = Math.min(12, Math.max(1, validated.month ?? 1));
    } else if (validated.targetType === 'YEARLY_REVENUE') {
      monthVal = 0;
    } else {
      monthVal = validated.month ?? 0;
    }

    const currency = validated.currency || user.defaultCurrency || 'USD';

    const target = await prisma.target.upsert({
      where: {
        userId_targetType_year_month_metricType: {
          userId: user.id,
          targetType: validated.targetType,
          year: validated.year,
          month: monthVal,
          metricType: validated.metricType,
        },
      },
      update: {
        targetAmount: validated.targetAmount,
        currency,
      },
      create: {
        userId: user.id,
        targetType: validated.targetType,
        targetAmount: validated.targetAmount,
        currency,
        year: validated.year,
        month: monthVal,
        metricType: validated.metricType,
      },
    });

    let scopeLabel = `Year ${target.year}`;
    if (target.targetType === 'QUARTERLY_REVENUE') {
      scopeLabel = `Q${target.month} ${target.year}`;
    } else if (target.targetType === 'MONTHLY_REVENUE') {
      scopeLabel = `Month ${target.month}/${target.year}`;
    }

    await logActivity({
      userId: user.id,
      actionType: 'TARGET_SET',
      entityType: 'TARGET',
      entityId: target.id,
      description: `Set target ${target.targetType} for ${scopeLabel}: ${target.currency} ${target.targetAmount}`,
      newValues: target,
    });

    return NextResponse.json({ success: true, target });
  } catch (error: any) {
    console.error('Target POST error:', error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error.message || 'Failed to save target' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    const target = await prisma.target.findFirst({
      where: { id, userId: user.id },
    });

    if (!target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    await prisma.target.delete({
      where: { id: target.id },
    });

    await logActivity({
      userId: user.id,
      actionType: 'TARGET_DELETED',
      entityType: 'TARGET',
      entityId: target.id,
      description: `Deleted ${target.targetType} target for ${target.year}`,
      oldValues: target,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Target DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete target' }, { status: 500 });
  }
}
