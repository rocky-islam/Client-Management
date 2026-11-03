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

    const where: any = { userId: user.id, year };
    if (month !== undefined) where.month = month;

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

    const target = await prisma.target.upsert({
      where: {
        userId_targetType_year_month_metricType: {
          userId: user.id,
          targetType: validated.targetType,
          year: validated.year,
          month: validated.month ?? 0,
          metricType: validated.metricType,
        },
      },
      update: {
        targetAmount: validated.targetAmount,
        currency: validated.currency || user.defaultCurrency || 'USD',
      },
      create: {
        userId: user.id,
        targetType: validated.targetType,
        targetAmount: validated.targetAmount,
        currency: validated.currency || user.defaultCurrency || 'USD',
        year: validated.year,
        month: validated.month ?? null,
        metricType: validated.metricType,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'TARGET_SET',
      entityType: 'TARGET',
      entityId: target.id,
      description: `Set target ${target.targetType} for ${target.month ? `Month ${target.month}/` : ''}${target.year}: ${target.currency} ${target.targetAmount}`,
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
