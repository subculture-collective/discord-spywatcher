-- Advanced Performance Indexes for Discord Spywatcher
-- This script adds PostgreSQL-specific indexes not supported by Prisma schema
-- Run this after Prisma migrations to add partial indexes, GIN indexes, etc.

-- ============================================================================
-- Partial Indexes (indexes with WHERE clauses for filtered queries)
-- ============================================================================

-- Partial index for multi-client presence events (only indexes rows with multiple clients)
CREATE INDEX IF NOT EXISTS idx_presence_multi_client 
  ON "PresenceEvent"("userId") 
  WHERE array_length(clients, 1) > 1;

-- Partial index for fast reaction times (< 5000ms)
CREATE INDEX IF NOT EXISTS idx_reaction_fast_delta 
  ON "ReactionTime"("deltaMs", "observerId") 
  WHERE "deltaMs" < 5000;

-- Partial index for recent events (last 90 days) - useful for analytics
CREATE INDEX IF NOT EXISTS idx_message_recent 
  ON "MessageEvent"("guildId", "createdAt" DESC) 
  WHERE "createdAt" >= NOW() - INTERVAL '90 days';

CREATE INDEX IF NOT EXISTS idx_typing_recent 
  ON "TypingEvent"("guildId", "createdAt" DESC) 
  WHERE "createdAt" >= NOW() - INTERVAL '90 days';

-- Partial index for new accounts (< 14 days old)
CREATE INDEX IF NOT EXISTS idx_join_new_accounts 
  ON "JoinEvent"("guildId", "accountAgeDays") 
  WHERE "accountAgeDays" < 14;

-- ============================================================================
-- GIN Indexes for JSONB columns (full-text and containment queries)
-- ============================================================================

-- GIN indexes for metadata columns allow efficient JSON querying
CREATE INDEX IF NOT EXISTS idx_presence_metadata_gin 
  ON "PresenceEvent" USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_typing_metadata_gin 
  ON "TypingEvent" USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_message_metadata_gin 
  ON "MessageEvent" USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_reaction_metadata_gin 
  ON "ReactionTime" USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_join_metadata_gin 
  ON "JoinEvent" USING GIN (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_role_metadata_gin 
  ON "RoleChangeEvent" USING GIN (metadata jsonb_path_ops);

-- ============================================================================
-- Additional Covering Indexes (include frequently accessed columns)
-- ============================================================================

-- Covering index for common presence queries (includes username)
-- Note: Prisma doesn't support INCLUDE yet, but this is useful for raw queries
-- CREATE INDEX IF NOT EXISTS idx_presence_user_created_covering 
--   ON "PresenceEvent"("userId", "createdAt" DESC) 
--   INCLUDE (username, clients);

-- ============================================================================
-- Index Maintenance Comments
-- ============================================================================

-- Run ANALYZE after creating indexes to update statistics
ANALYZE "PresenceEvent";
ANALYZE "TypingEvent";
ANALYZE "MessageEvent";
ANALYZE "ReactionTime";
ANALYZE "JoinEvent";
ANALYZE "RoleChangeEvent";
ANALYZE "User";

-- Monitor index usage with:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan;

-- Check index sizes with:
-- SELECT schemaname, tablename, indexname, 
--        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- Find unused indexes (idx_scan = 0):
-- SELECT schemaname, tablename, indexname 
-- FROM pg_stat_user_indexes 
-- WHERE idx_scan = 0 AND indexrelid NOT IN (
--   SELECT indexrelid FROM pg_index WHERE indisprimary OR indisunique
-- );
