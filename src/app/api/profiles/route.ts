import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { DEFAULT_PROFILES } from '@/lib/constants';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    // 1. Fetch user's profiles from DB
    let profiles = await prisma.profile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    // 2. If user has no profiles yet, only seed if user has never deleted or managed profiles before
    if (profiles.length === 0) {
      const hasProfileHistory = await prisma.activityLog.findFirst({
        where: {
          userId: user.id,
          entityType: 'PROFILE',
        },
      });

      if (!hasProfileHistory) {
        await prisma.profile.createMany({
          data: DEFAULT_PROFILES.map((name) => ({
            userId: user.id,
            name,
            platform: name,
            isDefault: false,
            color: name === 'Fiverr' ? '#10B981' : name === 'Upwork' ? '#14A800' : '#4F46E5',
          })),
          skipDuplicates: true,
        });

        profiles = await prisma.profile.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    // 3. Fetch user projects to calculate profile aggregates
    const userProjects = await prisma.project.findMany({
      where: { userId: user.id, isDeleted: false },
      select: {
        id: true,
        profileName: true,
        orderStatus: true,
        value: true,
        advancePayment: true,
        payments: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
    });

    // 4. Calculate stats per profile
    const profilesWithStats = profiles.map((p) => {
      const matchedProjects = userProjects.filter((prj) => prj.profileName === p.name);
      const totalProjects = matchedProjects.length;
      let totalValue = 0;
      let totalReceived = 0;
      let activeProjects = 0;
      let deliveredProjects = 0;

      for (const prj of matchedProjects) {
        totalValue += Number(prj.value || 0);
        const paymentsSum = prj.payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
        totalReceived += Number(prj.advancePayment || 0) + paymentsSum;

        if (prj.orderStatus === 'DELIVERED') {
          deliveredProjects++;
        } else if (prj.orderStatus !== 'CANCELLED') {
          activeProjects++;
        }
      }

      const outstanding = Math.max(0, totalValue - totalReceived);

      return {
        id: p.id,
        name: p.name,
        platform: p.platform || 'Freelance',
        description: p.description,
        profileLink: p.profileLink,
        color: p.color || '#4F46E5',
        isDefault: p.isDefault,
        createdAt: p.createdAt,
        totalProjects,
        activeProjects,
        deliveredProjects,
        totalValue,
        totalReceived,
        outstanding,
      };
    });

    return NextResponse.json({ profiles: profilesWithStats });
  } catch (error: any) {
    console.error('Profiles GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.profile.findFirst({
      where: {
        userId: user.id,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Profile "${name}" already exists` },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        name,
        platform: body.platform?.trim() || 'Freelance',
        description: body.description?.trim() || null,
        profileLink: body.profileLink?.trim() || null,
        color: body.color || '#4F46E5',
        isDefault: false,
      },
    });

    await logActivity({
      userId: user.id,
      actionType: 'PROFILE_CREATED',
      entityType: 'PROFILE',
      entityId: profile.id,
      description: `Created new freelance profile "${profile.name}" (${profile.platform})`,
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Profiles POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create profile' }, { status: 500 });
  }
}
