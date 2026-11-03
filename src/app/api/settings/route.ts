import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, verifyPassword, hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

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

    // Full user lookup for credential verification
    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let emailChanged = false;
    let newEmail = user.email;

    // 1. Email Change Request
    if (body.email && body.email.trim().toLowerCase() !== fullUser.email.toLowerCase()) {
      const emailCandidate = body.email.trim().toLowerCase();

      // Check current password for security when changing email
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change your login email address' },
          { status: 400 }
        );
      }

      const isCurrentValid = await verifyPassword(body.currentPassword, fullUser.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      // Check if email already used by another account
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: emailCandidate },
      });

      if (existingUserWithEmail && existingUserWithEmail.id !== user.id) {
        return NextResponse.json(
          { error: `The email address "${emailCandidate}" is already in use by another account.` },
          { status: 400 }
        );
      }

      dataToUpdate.email = emailCandidate;
      emailChanged = true;
      newEmail = emailCandidate;
    }

    // 2. Password Change Request
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isCurrentValid = await verifyPassword(body.currentPassword, fullUser.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      dataToUpdate.passwordHash = await hashPassword(body.newPassword);
    }

    // Perform database update
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

    // If email was changed, re-issue new session token cookie
    if (emailChanged) {
      const token = await createSessionToken(user.id, newEmail);
      await setSessionCookie(token);
    }

    await logActivity({
      userId: user.id,
      actionType: 'SETTINGS_UPDATED',
      entityType: 'AUTH',
      entityId: user.id,
      description: emailChanged
        ? `Updated login email to "${newEmail}" and profile settings`
        : body.newPassword
        ? `Changed account password and security settings`
        : `Updated business profile and application settings`,
    });

    return NextResponse.json({
      success: true,
      user: updated,
      emailChanged,
      message: emailChanged
        ? `Email updated to ${newEmail}. Use this new email for future logins.`
        : 'Settings updated successfully.',
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
