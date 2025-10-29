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
  });

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, closing database connections...`);
  try {
    await db.$disconnect();
    console.log('Database connections closed.');
  } catch (error) {
    console.error('Error during database disconnect:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await db.$disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled Rejection:', reason);
  await db.$disconnect();
  process.exit(1);
});

// Connection pooling is configured via DATABASE_URL query parameters:
// postgresql://user:password@localhost:5432/spywatcher?connection_limit=10&pool_timeout=20
// 
// Recommended settings:
// - connection_limit: 10-20 for small apps, 20-50 for medium apps
// - pool_timeout: 20 seconds
// - connect_timeout: 10 seconds

