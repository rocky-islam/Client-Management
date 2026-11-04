import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { DEFAULT_PROFILES } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit verification code' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    // 1. Fetch latest verification token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'No pending verification found. Please sign up or request a new code.' },
        { status: 400 }
      );
    }

    // 2. Check Expiration
    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.deleteMany({
        where: { email: normalizedEmail },
      });
      return NextResponse.json(
        { error: 'Verification code has expired (10 minutes). Please request a new code.' },
        { status: 400 }
      );
    }

    // 3. Verify OTP
    const isOtpValid = await verifyPassword(cleanOtp, tokenRecord.otpHash);
    if (!isOtpValid) {
      return NextResponse.json(
        { error: 'Invalid verification code! Please check the code and try again.' },
        { status: 400 }
      );
    }

    // 4. Duplicate check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await prisma.verificationToken.deleteMany({
        where: { email: normalizedEmail },
      });
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 400 }
      );
    }

    // 5. Parse signup payload
    let payload: {
      name: string;
      passwordHash: string;
      phone: string | null;
      businessName: string;
    };

    try {
      payload = JSON.parse(tokenRecord.payload);
    } catch {
      return NextResponse.json(
        { error: 'Invalid registration payload. Please submit the form again.' },
        { status: 400 }
      );
    }

    // 6. Role determination: rocky@admin.com is always MASTER, all others USER (Member)
    const role = normalizedEmail === 'rocky@admin.com' ? 'MASTER' : 'USER';

    // 7. Create User
    const newUser = await prisma.user.create({
      data: {
        name: payload.name,
        email: normalizedEmail,
        phone: payload.phone,
        passwordHash: payload.passwordHash,
        role,
        status: 'ACTIVE',
        businessName: payload.businessName,
        defaultCurrency: 'USD',
        baseCurrency: 'USD',
        timezone: 'Asia/Dhaka',
      },
    });

    // 8. Seed default profiles
    try {
      await prisma.profile.createMany({
        data: DEFAULT_PROFILES.map((pName) => ({
          userId: newUser.id,
          name: pName,
          platform: pName,
          isDefault: true,
        })),
        skipDuplicates: true,
      });
    } catch (profileErr) {
      console.warn('Initial profiles seeding skipped:', profileErr);
    }

    // 9. Clean up verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // 10. Issue session cookie
    const token = await createSessionToken(newUser.id, newUser.email, newUser.role);
    await setSessionCookie(token);

    // 11. Activity Log
    await logActivity({
      userId: newUser.id,
      actionType: 'USER_REGISTERED',
      entityType: 'AUTH',
      entityId: newUser.id,
      description: `New user ${newUser.name} (${newUser.email}) verified via OTP and joined as ${newUser.role}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Account successfully verified and created!',
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
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete verification. Please try again.' },
      { status: 500 }
    );
  }
}
