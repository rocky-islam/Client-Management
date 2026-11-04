import * as React from 'react';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';

const COOKIE_NAME = 'rocky_session_token';
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'rocky-business-manager-production-secret-auth-key-2026-super-secure'
);

// Safe React cache wrapper that works both in Next.js Server Components and standalone Node/tsx scripts
const cacheFn = typeof (React as any).cache === 'function' ? (React as any).cache : <T extends (...args: any[]) => any>(fn: T): T => fn;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string, email: string, role: string = 'USER'): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<{ userId: string; email: string; role?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as string) || 'USER',
    };
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// React cache deduplicates getCurrentUser calls during the same server render pass
export const getCurrentUser = cacheFn(async () => {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        businessName: true,
        avatarUrl: true,
        defaultCurrency: true,
        baseCurrency: true,
        timezone: true,
        dateFormat: true,
        createdAt: true,
      },
    });

    if (!user || user.status === 'SUSPENDED') {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireMaster() {
  const user = await requireAuth();
  if (user.role !== 'MASTER' && user.role !== 'ADMIN') {
    throw new Error('Forbidden: Master privileges required');
  }
  return user;
}
