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

    // Delete the profile
    await prisma.profile.delete({
      where: { id: params.id },
    });

    // Update any projects referencing this profile so they don't hold a dead reference
    await prisma.project.updateMany({
      where: { userId: user.id, profileName: profile.name },
      data: { profileName: 'General' },
    });

    await logActivity({
      userId: user.id,
      actionType: 'PROFILE_DELETED',
      entityType: 'PROFILE',
      entityId: profile.id,
      description: `Deleted profile "${profile.name}"`,
    });

    return NextResponse.json({ success: true, message: `Profile "${profile.name}" deleted successfully` });
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

    const newName = body.name?.trim() || profile.name;
    const oldName = profile.name;

    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: {
        name: newName,
        platform: body.platform?.trim() || profile.platform,
        description: body.description !== undefined ? body.description?.trim() || null : profile.description,
        profileLink: body.profileLink !== undefined ? body.profileLink?.trim() || null : profile.profileLink,
        color: body.color || profile.color,
      },
    });

    // If profile name changed, cascade update to all associated projects
    if (newName !== oldName) {
      await prisma.project.updateMany({
        where: { userId: user.id, profileName: oldName },
        data: { profileName: newName },
      });
    }

    await logActivity({
      userId: user.id,
      actionType: 'PROFILE_UPDATED',
      entityType: 'PROFILE',
      entityId: updated.id,
      description: `Updated profile "${updated.name}"${newName !== oldName ? ` (renamed from "${oldName}")` : ''}`,
      oldValues: profile,
      newValues: updated,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
