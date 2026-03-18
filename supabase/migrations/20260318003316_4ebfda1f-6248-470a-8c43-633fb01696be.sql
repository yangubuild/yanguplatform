
-- Step 1: Add trust scoring columns to searchable_entities
ALTER TABLE public.searchable_entities
  ADD COLUMN trust_score real NOT NULL DEFAULT 0,
  ADD COLUMN report_count integer NOT NULL DEFAULT 0,
  ADD COLUMN review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN avg_rating real;
