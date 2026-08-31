ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "is_external" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "external_reviewer_links" (
    "id" text NOT NULL,
    "org_id" text NOT NULL,
    "reviewee_id" text NOT NULL,
    "reviewer_name" text NOT NULL,
    "reviewer_email" text NOT NULL,
    "relationship" "Relationship" NOT NULL,
    "created_at" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "external_reviewer_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "external_reviewer_links_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "external_reviewer_links_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "external_reviewer_links_reviewee_id_reviewer_email_key" ON "external_reviewer_links"("reviewee_id", "reviewer_email");
CREATE INDEX IF NOT EXISTS "external_reviewer_links_org_id_idx" ON "external_reviewer_links"("org_id");
