import { PrismaClient as BasePrismaClient, Prisma } from '@prisma/client';

export type PrismaClient = BasePrismaClient & {
  profile: Prisma.ProfileDelegate;
  verificationToken: Prisma.VerificationTokenDelegate;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  (globalForPrisma.prisma ??
  new BasePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
