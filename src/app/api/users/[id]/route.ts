import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireMaster, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireMaster();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        businessName: true,
        defaultCurrency: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            clients: true,
            invoices: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('User GET [id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireMaster();
    const body = await request.json();

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = body.name.trim();
    if (body.phone !== undefined) dataToUpdate.phone = body.phone ? body.phone.trim() : null;
    if (body.businessName) dataToUpdate.businessName = body.businessName.trim();

    // Role assignment & restrictions
    if (body.role && ['MASTER', 'ADMIN', 'USER'].includes(body.role)) {
      // Prevent rocky@admin.com from ever being demoted
      if (targetUser.email.toLowerCase() === 'rocky@admin.com' && body.role !== 'MASTER') {
        return NextResponse.json(
          { error: 'The primary Master account (rocky@admin.com) cannot be demoted from MASTER.' },
          { status: 400 }
        );
      }
      // Prevent Master from accidentally demoting themselves if they are the only Master
      if (targetUser.id === currentUser.id && body.role !== 'MASTER') {
        return NextResponse.json(
          { error: 'You cannot revoke your own Master role.' },
          { status: 400 }
        );
      }
      dataToUpdate.role = body.role;
    }

    // Status assignment & restrictions
    if (body.status && ['ACTIVE', 'SUSPENDED'].includes(body.status)) {
      if (targetUser.id === currentUser.id && body.status === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'You cannot suspend your own Master account.' },
          { status: 400 }
        );
      }
      dataToUpdate.status = body.status;
    }

    // Email change with uniqueness check
    if (body.email && body.email.toLowerCase().trim() !== targetUser.email.toLowerCase()) {
      const emailCandidate = body.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: emailCandidate } });
      if (existing && existing.id !== targetUser.id) {
        return NextResponse.json(
          { error: `The email address "${emailCandidate}" is already in use.` },
          { status: 400 }
        );
      }
      dataToUpdate.email = emailCandidate;
    }

    // Admin password reset
    if (body.newPassword && body.newPassword.length >= 6) {
      dataToUpdate.passwordHash = await hashPassword(body.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        businessName: true,
        updatedAt: true,
      },
    });

    await logActivity({
      userId: currentUser.id,
      actionType: 'USER_UPDATED_BY_ADMIN',
      entityType: 'AUTH',
      entityId: updatedUser.id,
      description: `Master ${currentUser.name} updated user ${updatedUser.name} (${updatedUser.email})`,
      newValues: updatedUser,
      oldValues: targetUser,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('User PUT [id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireMaster();

    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own Master account.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.email.toLowerCase() === 'rocky@admin.com') {
      return NextResponse.json(
        { error: 'The primary Master account (rocky@admin.com) is permanently protected and cannot be deleted.' },
        { status: 400 }
      );
    }

    // Cascade delete user
    await prisma.user.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: currentUser.id,
      actionType: 'USER_DELETED_BY_ADMIN',
      entityType: 'AUTH',
      entityId: targetUser.id,
      description: `Master ${currentUser.name} deleted user ${targetUser.name} (${targetUser.email})`,
      oldValues: targetUser,
    });

    return NextResponse.json({ success: true, message: `User ${targetUser.name} deleted successfully` });
  } catch (error: any) {
    console.error('User DELETE [id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
