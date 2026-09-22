import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { smartPricePrisma?: PrismaClient };
export const prisma = globalForPrisma.smartPricePrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.smartPricePrisma = prisma;
