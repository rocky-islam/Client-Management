import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { DEFAULT_PROFILES } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, businessName } = body;

    // 1. Validations
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Full name is required (at least 2 characters)' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const sanitizedPhone = phone ? phone.trim() : null;

    // 2. Strict Duplicate Prevention
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // 3. Strict Role Assignment:
    // - rocky@admin.com is always MASTER
    // - All new registrations from signup are strictly assigned role 'USER' (Member)
    const role = normalizedEmail === 'rocky@admin.com' ? 'MASTER' : 'USER';

    // 4. Hash password
    const hashedPassword = await hashPassword(password);

    // 5. Create User
    const newUser = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: normalizedEmail,
        phone: sanitizedPhone,
        passwordHash: hashedPassword,
        role,
        status: 'ACTIVE',
        businessName: businessName?.trim() || `${sanitizedName}'s Workspace`,
        defaultCurrency: 'USD',
        baseCurrency: 'USD',
        timezone: 'Asia/Dhaka',
      },
    });

    // 6. Seed starter profile channels for the new user
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

    // 7. Auto-login session cookie
    const token = await createSessionToken(newUser.id, newUser.email, newUser.role);
    await setSessionCookie(token);

    // 8. Activity log
    await logActivity({
      userId: newUser.id,
      actionType: 'USER_REGISTERED',
      entityType: 'AUTH',
      entityId: newUser.id,
      description: `New user ${newUser.name} (${newUser.email}) registered with role ${newUser.role}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        businessName: newUser.businessName,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
