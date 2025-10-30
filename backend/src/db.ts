import { PrismaClient } from '@prisma/client';

// Global singleton for Prisma Client to prevent multiple instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Determine if using PgBouncer based on connection string
const isPgBouncer = process.env.DATABASE_URL?.includes('pgbouncer=true') ?? false;

// Configure connection pooling and logging based on environment
// When using PgBouncer (transaction pooling mode):
// - Keep connection_limit low (1-5) since PgBouncer handles pooling
// - Disable interactive transactions for better compatibility
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

// Initialize slow query logger middleware
// This must be done after the db instance is created but before queries run
// The initialization is done in the application entry point (server.ts or index.ts)

// Connection pool status tracking
let isShuttingDown = false;

/**
 * Get connection pool metrics
 */
export async function getConnectionPoolMetrics() {
  try {
    // Query for active connections
    const activeConnections = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'active'
    `;

    // Query for idle connections
    const idleConnections = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'idle'
    `;

    // Query for total connections
    const totalConnections = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    // Get max connections setting
    const maxConnections = await db.$queryRaw<Array<{ setting: string }>>`
      SELECT setting
      FROM pg_settings
      WHERE name = 'max_connections'
    `;

    return {
      active: Number(activeConnections[0]?.count ?? 0),
      idle: Number(idleConnections[0]?.count ?? 0),
      total: Number(totalConnections[0]?.count ?? 0),
      max: Number(maxConnections[0]?.setting ?? 0),
      utilizationPercent: maxConnections[0]?.setting
        ? ((Number(totalConnections[0]?.count ?? 0) / Number(maxConnections[0].setting)) * 100).toFixed(2)
        : '0',
      isPgBouncer,
      isShuttingDown,
    };
  } catch (error) {
    console.error('Error fetching connection pool metrics:', error);
    return {
      active: 0,
      idle: 0,
      total: 0,
      max: 0,
      utilizationPercent: '0',
      isPgBouncer,
      isShuttingDown,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return { healthy: true, responseTime };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}, initiating graceful shutdown...`);
  
  try {
    console.log('Closing database connections...');
    await db.$disconnect();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error during database disconnect:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', async (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (!isShuttingDown) {
    isShuttingDown = true;
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      console.error('Error during emergency disconnect:', disconnectError);
    }
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  if (!isShuttingDown) {
    isShuttingDown = true;
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      console.error('Error during emergency disconnect:', disconnectError);
    }
  }
  process.exit(1);
});

// Connection pooling configuration:
//
// When using PgBouncer (recommended for production):
// DATABASE_URL=postgresql://user:password@pgbouncer:6432/dbname?pgbouncer=true
// - PgBouncer handles connection pooling at the server level
// - Configure PgBouncer pool_mode=transaction for best compatibility with Prisma
// - Keep Prisma connection_limit low (1-5) as PgBouncer manages the pool
// - PgBouncer configuration in pgbouncer/pgbouncer.ini
//
// When connecting directly to PostgreSQL:
// DATABASE_URL=postgresql://user:password@postgres:5432/dbname?connection_limit=20&pool_timeout=20&connect_timeout=10
// - connection_limit: 10-20 for small apps, 20-50 for medium apps
// - pool_timeout: 20 seconds (time to wait for available connection)
// - connect_timeout: 10 seconds (time to wait for initial connection)

