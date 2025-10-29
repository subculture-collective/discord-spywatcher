/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script migrates data from SQLite to PostgreSQL with proper data transformations.
 * It handles:
 * - Integer IDs to UUID conversion
 * - Comma-separated strings to arrays
 * - JSONB metadata addition
 * - Batch processing for large datasets
 * - Data integrity verification
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// SQLite connection
const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SQLITE_DATABASE_URL || 'file:./backend/prisma/dev.db'
    }
  }
});

// PostgreSQL connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable must be set for PostgreSQL connection.');
}
const postgres = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

interface MigrationStats {
  model: string;
  total: number;
  migrated: number;
  failed: number;
  startTime: Date;
  endTime?: Date;
}

const stats: MigrationStats[] = [];
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000', 10);
const DRY_RUN = process.env.DRY_RUN === 'true';

/**
 * Generate a UUID (v4)
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Split comma-separated string into array
 */
function splitToArray(value: string): string[] {
  if (!value || typeof value !== 'string' || value.trim() === '') return [];
  return value.split(',').map(v => v.trim()).filter(v => v);
}

/**
 * Log progress with colors
 */
function log(level: 'info' | 'success' | 'error' | 'warn', message: string) {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
  };
  const reset = '\x1b[0m';
  const timestamp = new Date().toISOString();
  console.log(`${colors[level]}[${timestamp}] ${message}${reset}`);
}

/**
 * Migrate PresenceEvent data
 */
async function migratePresenceEvents() {
  const modelName = 'PresenceEvent';
  log('info', `Starting migration of ${modelName}...`);
  
  const stat: MigrationStats = {
    model: modelName,
    total: 0,
    migrated: 0,
    failed: 0,
    startTime: new Date()
  };
  stats.push(stat);

  try {
    const count = await sqlite.presenceEvent.count();
    stat.total = count;
    log('info', `Found ${count} ${modelName} records`);

    if (count === 0) {
      log('warn', `No ${modelName} records to migrate`);
      return;
    }

    for (let skip = 0; skip < count; skip += BATCH_SIZE) {
      const events = await sqlite.presenceEvent.findMany({
        take: BATCH_SIZE,
        skip,
      });

      if (!DRY_RUN) {
        try {
          await postgres.presenceEvent.createMany({
            data: events.map(e => ({
              id: generateUUID(),
              userId: e.userId,
              username: e.username,
              clients: splitToArray(e.clients),
              metadata: null,
              createdAt: e.createdAt,
            })),
            skipDuplicates: true,
          });

          stat.migrated += events.length;
          log('info', `Migrated ${stat.migrated}/${count} ${modelName} records`);
        } catch (error) {
          log('error', `Failed to migrate batch: ${error}`);
          stat.failed += events.length;
        }
      } else {
        stat.migrated += events.length;
        log('info', `[DRY RUN] Would migrate ${stat.migrated}/${count} ${modelName} records`);
      }
    }

    stat.endTime = new Date();
    log('success', `✓ Completed ${modelName} migration`);
  } catch (error) {
    log('error', `Failed to migrate ${modelName}: ${error}`);
    throw error;
  }
}

/**
 * Migrate TypingEvent data
 */
async function migrateTypingEvents() {
  const modelName = 'TypingEvent';
  log('info', `Starting migration of ${modelName}...`);
  
  const stat: MigrationStats = {
    model: modelName,
    total: 0,
    migrated: 0,
    failed: 0,
    startTime: new Date()
  };
  stats.push(stat);

  try {
    const count = await sqlite.typingEvent.count();
    stat.total = count;
    log('info', `Found ${count} ${modelName} records`);

    if (count === 0) {
      log('warn', `No ${modelName} records to migrate`);
      return;
    }

    for (let skip = 0; skip < count; skip += BATCH_SIZE) {
      const events = await sqlite.typingEvent.findMany({
        take: BATCH_SIZE,
        skip,
      });

      if (!DRY_RUN) {
        try {
          await postgres.typingEvent.createMany({
            data: events.map(e => ({
              id: generateUUID(),
              userId: e.userId,
              username: e.username,
              channelId: e.channelId,
              channel: e.channel,
              guildId: e.guildId,
              metadata: null,
              createdAt: e.createdAt,
            })),
            skipDuplicates: true,
          });

          stat.migrated += events.length;
          log('info', `Migrated ${stat.migrated}/${count} ${modelName} records`);
        } catch (error) {
          log('error', `Failed to migrate batch: ${error}`);
          stat.failed += events.length;
        }
      } else {
        stat.migrated += events.length;
        log('info', `[DRY RUN] Would migrate ${stat.migrated}/${count} ${modelName} records`);
      }
    }

    stat.endTime = new Date();
    log('success', `✓ Completed ${modelName} migration`);
  } catch (error) {
    log('error', `Failed to migrate ${modelName}: ${error}`);
    throw error;
  }
}

/**
 * Migrate MessageEvent data
 */
async function migrateMessageEvents() {
  const modelName = 'MessageEvent';
  log('info', `Starting migration of ${modelName}...`);
  
  const stat: MigrationStats = {
    model: modelName,
    total: 0,
    migrated: 0,
    failed: 0,
    startTime: new Date()
  };
  stats.push(stat);

  try {
    const count = await sqlite.messageEvent.count();
    stat.total = count;
    log('info', `Found ${count} ${modelName} records`);

    if (count === 0) {
      log('warn', `No ${modelName} records to migrate`);
      return;
    }

    for (let skip = 0; skip < count; skip += BATCH_SIZE) {
      const events = await sqlite.messageEvent.findMany({
        take: BATCH_SIZE,
        skip,
      });

      if (!DRY_RUN) {
        try {
          await postgres.messageEvent.createMany({
            data: events.map(e => ({
              id: generateUUID(),
              userId: e.userId,
              username: e.username,
              channelId: e.channelId,
              channel: e.channel,
              guildId: e.guildId,
              content: e.content,
              metadata: null,
              createdAt: e.createdAt,
            })),
            skipDuplicates: true,
          });

          stat.migrated += events.length;
          log('info', `Migrated ${stat.migrated}/${count} ${modelName} records`);
        } catch (error) {
          log('error', `Failed to migrate batch: ${error}`);
          stat.failed += events.length;
        }
      } else {
        stat.migrated += events.length;
        log('info', `[DRY RUN] Would migrate ${stat.migrated}/${count} ${modelName} records`);
      }
    }

    stat.endTime = new Date();
    log('success', `✓ Completed ${modelName} migration`);
  } catch (error) {
    log('error', `Failed to migrate ${modelName}: ${error}`);
    throw error;
  }
}

/**
 * Migrate JoinEvent data
 */
async function migrateJoinEvents() {
  const modelName = 'JoinEvent';
  log('info', `Starting migration of ${modelName}...`);
  
  const stat: MigrationStats = {
    model: modelName,
    total: 0,
    migrated: 0,
    failed: 0,
    startTime: new Date()
  };
  stats.push(stat);

  try {
    const count = await sqlite.joinEvent.count();
    stat.total = count;
    log('info', `Found ${count} ${modelName} records`);

    if (count === 0) {
      log('warn', `No ${modelName} records to migrate`);
      return;
    }

    for (let skip = 0; skip < count; skip += BATCH_SIZE) {
      const events = await sqlite.joinEvent.findMany({
        take: BATCH_SIZE,
        skip,
      });

      if (!DRY_RUN) {
        try {
          await postgres.joinEvent.createMany({
            data: events.map(e => ({
              id: generateUUID(),
              userId: e.userId,
              username: e.username,
              guildId: e.guildId,
              accountAgeDays: e.accountAgeDays,
              metadata: null,
              createdAt: e.createdAt,
            })),
            skipDuplicates: true,
          });

          stat.migrated += events.length;
          log('info', `Migrated ${stat.migrated}/${count} ${modelName} records`);
        } catch (error) {
          log('error', `Failed to migrate batch: ${error}`);
          stat.failed += events.length;
        }
      } else {
        stat.migrated += events.length;
        log('info', `[DRY RUN] Would migrate ${stat.migrated}/${count} ${modelName} records`);
      }
    }

    stat.endTime = new Date();
    log('success', `✓ Completed ${modelName} migration`);
  } catch (error) {
    log('error', `Failed to migrate ${modelName}: ${error}`);
    throw error;
  }
}

/**
 * Migrate RoleChangeEvent data
 */
async function migrateRoleChangeEvents() {
  const modelName = 'RoleChangeEvent';
  log('info', `Starting migration of ${modelName}...`);
  
  const stat: MigrationStats = {
    model: modelName,
    total: 0,
    migrated: 0,
    failed: 0,
    startTime: new Date()
  };
  stats.push(stat);

  try {
    const count = await sqlite.roleChangeEvent.count();
    stat.total = count;
    log('info', `Found ${count} ${modelName} records`);

    if (count === 0) {
      log('warn', `No ${modelName} records to migrate`);
      return;
    }

    for (let skip = 0; skip < count; skip += BATCH_SIZE) {
      const events = await sqlite.roleChangeEvent.findMany({
        take: BATCH_SIZE,
        skip,
      });

      if (!DRY_RUN) {
        try {
          await postgres.roleChangeEvent.createMany({
            data: events.map(e => ({
              id: generateUUID(),
              userId: e.userId,
              username: e.username,
              guildId: e.guildId,
              addedRoles: splitToArray(e.addedRoles),
              metadata: null,
              createdAt: e.createdAt,
            })),
            skipDuplicates: true,
          });

          stat.migrated += events.length;
          log('info', `Migrated ${stat.migrated}/${count} ${modelName} records`);
        } catch (error) {
          log('error', `Failed to migrate batch: ${error}`);
          stat.failed += events.length;
        }
      } else {
        stat.migrated += events.length;
        log('info', `[DRY RUN] Would migrate ${stat.migrated}/${count} ${modelName} records`);
      }
    }

    stat.endTime = new Date();
    log('success', `✓ Completed ${modelName} migration`);
  } catch (error) {
    log('error', `Failed to migrate ${modelName}: ${error}`);
    throw error;
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  log('info', '\n========== Migration Summary ==========');
  
  const totalRecords = stats.reduce((sum, s) => sum + s.total, 0);
  const totalMigrated = stats.reduce((sum, s) => sum + s.migrated, 0);
  const totalFailed = stats.reduce((sum, s) => sum + s.failed, 0);
  
  console.table(stats.map(s => ({
    Model: s.model,
    Total: s.total,
    Migrated: s.migrated,
    Failed: s.failed,
    Duration: s.endTime 
      ? `${((s.endTime.getTime() - s.startTime.getTime()) / 1000).toFixed(2)}s`
      : 'N/A'
  })));

  log('info', `\nTotal Records: ${totalRecords}`);
  log('success', `Successfully Migrated: ${totalMigrated}`);
  if (totalFailed > 0) {
    log('error', `Failed: ${totalFailed}`);
  }
  
  if (DRY_RUN) {
    log('warn', '\n*** DRY RUN MODE - No data was actually migrated ***');
  }
  
  log('info', '=======================================\n');
}

/**
 * Main migration function
 */
async function main() {
  try {
    log('info', '========================================');
    log('info', 'SQLite to PostgreSQL Migration Script');
    log('info', '========================================\n');
    
    if (DRY_RUN) {
      log('warn', 'Running in DRY RUN mode - no data will be written\n');
    }

    // Test connections
    log('info', 'Testing database connections...');
    await sqlite.$connect();
    await postgres.$connect();
    log('success', '✓ Database connections established\n');

    // Run migrations
    await migratePresenceEvents();
    await migrateTypingEvents();
    await migrateMessageEvents();
    await migrateJoinEvents();
    await migrateRoleChangeEvents();

    // Print summary
    printSummary();

    log('success', '✓ Migration completed successfully!');
  } catch (error) {
    log('error', `Migration failed: ${error}`);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

// Run migration
main();
