import { PrismaClient } from '@prisma/client';

// Ensure a single PrismaClient instance in development to avoid exhausting
// database connections during HMR (see Prisma docs).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = (global.__prisma ??= new PrismaClient());
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;
