-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('FREE', 'PRO');

-- CreateTable: organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "OrgPlan" NOT NULL DEFAULT 'FREE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Add isSuperAdmin to employees
ALTER TABLE "employees" ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Add org_id columns (nullable initially for safe migration)
ALTER TABLE "employees"          ADD COLUMN "org_id" TEXT;
ALTER TABLE "review_cycles"      ADD COLUMN "org_id" TEXT;
ALTER TABLE "question_templates" ADD COLUMN "org_id" TEXT;
ALTER TABLE "questions"          ADD COLUMN "org_id" TEXT;
ALTER TABLE "settings"           ADD COLUMN "org_id" TEXT;
ALTER TABLE "allowlist"          ADD COLUMN "org_id" TEXT;
ALTER TABLE "allowed_domains"    ADD COLUMN "org_id" TEXT;

-- Indexes
CREATE INDEX "employees_org_id_idx"          ON "employees"("org_id");
CREATE INDEX "review_cycles_org_id_idx"      ON "review_cycles"("org_id");
CREATE INDEX "question_templates_org_id_idx" ON "question_templates"("org_id");
CREATE INDEX "questions_org_id_idx"          ON "questions"("org_id");
CREATE INDEX "settings_org_id_idx"           ON "settings"("org_id");
CREATE INDEX "allowlist_org_id_idx"          ON "allowlist"("org_id");
CREATE INDEX "allowed_domains_org_id_idx"    ON "allowed_domains"("org_id");

-- FK constraints
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_templates" ADD CONSTRAINT "question_templates_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allowlist" ADD CONSTRAINT "allowlist_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allowed_domains" ADD CONSTRAINT "allowed_domains_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraints (scoped per org)
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_email_key";
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_employee_id_key";
CREATE UNIQUE INDEX "employees_org_id_email_key"       ON "employees"("org_id", "email");
CREATE UNIQUE INDEX "employees_org_id_employee_id_key" ON "employees"("org_id", "employee_id");

ALTER TABLE "allowlist"       DROP CONSTRAINT IF EXISTS "allowlist_email_key";
CREATE UNIQUE INDEX "allowlist_org_id_email_key"        ON "allowlist"("org_id", "email");

ALTER TABLE "allowed_domains" DROP CONSTRAINT IF EXISTS "allowed_domains_domain_key";
CREATE UNIQUE INDEX "allowed_domains_org_id_domain_key" ON "allowed_domains"("org_id", "domain");

-- Settings: replace global PK with org-scoped unique key
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_pkey";
ALTER TABLE "settings" ADD COLUMN "id" TEXT;
UPDATE "settings" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "settings" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "settings_org_id_key_key" ON "settings"("org_id", "key");

-- Questions: replace global sort_order unique with org-scoped
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_sort_order_key";
CREATE UNIQUE INDEX "questions_org_id_sort_order_key" ON "questions"("org_id", "sort_order");
