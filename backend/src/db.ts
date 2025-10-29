import { PrismaClient } from '@prisma/client';

// Global singleton for Prisma Client to prevent multiple instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure connection pooling and logging based on environment
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect();
});

// Connection pooling is configured via DATABASE_URL query parameters:
// postgresql://user:password@localhost:5432/spywatcher?connection_limit=10&pool_timeout=20
// 
// Recommended settings:
// - connection_limit: 10-20 for small apps, 20-50 for medium apps
// - pool_timeout: 20 seconds
// - connect_timeout: 10 seconds

