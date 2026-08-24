-- Drop unique constraint on questions sort_order (blocks drag reorder)
-- Replace with a plain index so ordering works without collision errors
DROP INDEX IF EXISTS "questions_org_id_sort_order_key";
CREATE INDEX IF NOT EXISTS "questions_org_id_sort_order_idx" ON "questions" ("org_id", "sort_order");

-- Add index on template items sort_order (had no index at all)
CREATE INDEX IF NOT EXISTS "question_template_items_template_id_sort_order_idx" ON "question_template_items" ("template_id", "sort_order");
