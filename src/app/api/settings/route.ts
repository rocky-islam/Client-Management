import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = body.name.trim();
    if (body.businessName) dataToUpdate.businessName = body.businessName.trim();
    if (body.defaultCurrency) dataToUpdate.defaultCurrency = body.defaultCurrency;
    if (body.baseCurrency) dataToUpdate.baseCurrency = body.baseCurrency;
    if (body.timezone) dataToUpdate.timezone = body.timezone;
    if (body.dateFormat) dataToUpdate.dateFormat = body.dateFormat;

    // Password change
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const isCurrentValid = await verifyPassword(body.currentPassword, fullUser.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      dataToUpdate.passwordHash = await hashPassword(body.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        defaultCurrency: true,
        baseCurrency: true,
        timezone: true,
        dateFormat: true,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'SETTINGS_UPDATED',
      entityType: 'AUTH',
      entityId: user.id,
      description: `Updated business profile and application settings`,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
