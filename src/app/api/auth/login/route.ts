import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look for user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Auto-bootstrap initial admin ONLY if database has 0 users (first-time deployment setup)
    if (!user) {
      const userCount = await prisma.user.count();
      
      if (userCount === 0) {
        const defaultAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@rockybusiness.com').toLowerCase();
        const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';
        
        // Allow creating initial admin on empty database
        if (normalizedEmail === defaultAdminEmail && password === adminPassword) {
          const hashedPassword = await hashPassword(password);
          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash: hashedPassword,
              name: process.env.INITIAL_ADMIN_NAME || 'Rocky Freelancer',
              businessName: 'Rocky Freelance Studio',
              defaultCurrency: 'USD',
              baseCurrency: 'USD',
              timezone: 'Asia/Dhaka',
            },
          });
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createSessionToken(user.id, user.email);
    await setSessionCookie(token);

    await logActivity({
      userId: user.id,
      actionType: 'LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      description: `User ${user.email} logged in successfully`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessName: user.businessName,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Authentication failed. Please check your credentials.' },
      { status: 500 }
    );
  }
}

