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
        { error: 'আপনার পুরো নাম লিখুন (কমপক্ষে ২ অক্ষর)' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'সঠিক ইমেইল এড্রেস লিখুন' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' },
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
        { error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। দয়া করে লগইন করুন।' },
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
          message: 'ভেরিফিকেশন কোড তৈরি হয়েছে (Resend টেস্ট মোড)।',
          devMode: true,
          devOtp: otp,
          warning:
            'Resend ফ্রি টেস্ট ডোমেইনে সরাসরি ইমেইল শুধু mdrockyislam.office@gmail.com এ যায়। টেস্ট সম্পন্ন করতে নিচে ওটিপি কোডটি প্রদান করা হয়েছে।',
        });
      }

      return NextResponse.json(
        {
          error:
            sendResult.error ||
            'ইমেইল পাঠাতে সমস্যা হয়েছে। আপনার Resend API কী বা ডোমেইন কনফিগারেশন চেক করুন।',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${normalizedEmail} এ ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।`,
      devMode: sendResult.devMode || false,
      devOtp: sendResult.devMode ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}

