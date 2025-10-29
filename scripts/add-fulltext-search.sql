-- Add full-text search support to MessageEvent
-- This script adds a GIN index on the content field for efficient text search

-- Add a tsvector column for full-text search (optional, for better performance)
ALTER TABLE "MessageEvent" ADD COLUMN IF NOT EXISTS content_search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS "MessageEvent_content_search_idx" ON "MessageEvent" USING GIN (content_search);

-- Alternative: Direct index on content field (simpler but slightly less performant)
-- CREATE INDEX IF NOT EXISTS "MessageEvent_content_idx" ON "MessageEvent" USING GIN (to_tsvector('english', content));

-- Example queries:
-- Search for messages containing specific words:
-- SELECT * FROM "MessageEvent" 
-- WHERE content_search @@ to_tsquery('english', 'search & terms');
--
-- Search with ranking:
-- SELECT *, ts_rank(content_search, to_tsquery('english', 'search & terms')) as rank
-- FROM "MessageEvent"
-- WHERE content_search @@ to_tsquery('english', 'search & terms')
-- ORDER BY rank DESC;
