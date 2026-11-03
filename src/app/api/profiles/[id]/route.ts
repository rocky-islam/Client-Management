import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const profile = await prisma.profile.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    await prisma.profile.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: user.id,
      actionType: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: profile.id,
      description: `Deleted profile "${profile.name}"`,
    });

    return NextResponse.json({ success: true, message: 'Profile deleted' });
  } catch (error: any) {
    console.error('Profile DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete profile' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const profile = await prisma.profile.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim() || profile.name,
        platform: body.platform?.trim() || profile.platform,
        description: body.description !== undefined ? body.description?.trim() || null : profile.description,
        profileLink: body.profileLink !== undefined ? body.profileLink?.trim() || null : profile.profileLink,
        color: body.color || profile.color,
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
