import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, businessName } = body;

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (at least 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const sanitizedPhone = phone ? phone.trim() : null;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    // 3. Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);
    const userPasswordHash = await hashPassword(password);

    // 4. Clean up any existing tokens for this email and save new one
    await prisma.verificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        otpHash,
        payload: JSON.stringify({
          name: sanitizedName,
          passwordHash: userPasswordHash,
          phone: sanitizedPhone,
          businessName: businessName?.trim() || `${sanitizedName}'s Workspace`,
        }),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      },
    });

    // 5. Send Email via Resend
    const sendResult = await sendOtpEmail({
      to: normalizedEmail,
      otp,
      name: sanitizedName,
    });

    if (!sendResult.success) {
      const isDomainRestricted =
        sendResult.error?.includes('You can only send testing emails to your own email address') ||
        sendResult.error?.includes('verify a domain at resend.com/domains');

      if (isDomainRestricted) {
        console.warn(
          `[RESEND RESTRICTION] Recipient ${normalizedEmail} blocked by Resend free tier. Dev simulation enabled. Code: ${otp}`
        );
        return NextResponse.json({
          success: true,
          message: 'Verification code generated (Resend Test Mode).',
          devMode: true,
          devOtp: otp,
          warning:
            'Resend free test domain delivers actual emails only to mdrockyislam.office@gmail.com. For testing with other emails, the OTP is displayed below.',
        });
      }

      return NextResponse.json(
        {
          error:
            sendResult.error ||
            'Failed to send verification email. Please check your Resend configuration.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      devMode: sendResult.devMode || false,
      devOtp: sendResult.devMode ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
