ALTER TABLE "review_assignments" ADD COLUMN IF NOT EXISTS "email_sent" boolean NOT NULL DEFAULT false;
