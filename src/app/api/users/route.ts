import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireMaster, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { DEFAULT_PROFILES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const currentUser = await requireMaster();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        businessName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: { where: { isDeleted: false } },
            clients: { where: { isDeleted: false } },
            invoices: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // MASTER first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ users, currentUserId: currentUser.id });
  } catch (error: any) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireMaster();
    const body = await request.json();
    const { name, email, phone, password, role, status, businessName } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required (at least 2 characters)' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Duplicate check
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole = ['MASTER', 'ADMIN', 'USER'].includes(role) ? role : 'USER';
    const assignedStatus = ['ACTIVE', 'SUSPENDED'].includes(status) ? status : 'ACTIVE';

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash: hashedPassword,
        role: assignedRole,
        status: assignedStatus,
        businessName: businessName?.trim() || `${name.trim()}'s Workspace`,
        defaultCurrency: 'USD',
        baseCurrency: 'USD',
        timezone: 'Asia/Dhaka',
      },
    });

    // Seed starter profiles
    try {
      await prisma.profile.createMany({
        data: DEFAULT_PROFILES.map((name) => ({
          userId: newUser.id,
          name,
          platform: name,
          isDefault: true,
        })),
        skipDuplicates: true,
      });
    } catch (e) {
      console.warn('Initial profiles seeding skipped:', e);
    }

    await logActivity({
      userId: currentUser.id,
      actionType: 'USER_CREATED_BY_ADMIN',
      entityType: 'AUTH',
      entityId: newUser.id,
      description: `Master ${currentUser.name} created user ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
