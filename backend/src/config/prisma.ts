import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // Prevent multiple instances of Prisma Client in development with hot reload
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export default prisma;
