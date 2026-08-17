-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "OrgPlan"      AS ENUM ('FREE', 'EXTENDED');
CREATE TYPE "CycleStatus"  AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE "Relationship" AS ENUM ('SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT');
CREATE TYPE "QuestionType" AS ENUM ('RATING', 'OPEN_TEXT');

-- ─── Organizations ────────────────────────────────────────────────────────────

CREATE TABLE "organizations" (
    "id"                 TEXT        NOT NULL,
    "name"               TEXT        NOT NULL,
    "slug"               TEXT        NOT NULL,
    "plan"               "OrgPlan"   NOT NULL DEFAULT 'FREE',
    "is_active"          BOOLEAN     NOT NULL DEFAULT true,
    "stripe_customer_id" TEXT,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- ─── Access Control ───────────────────────────────────────────────────────────

CREATE TABLE "allowlist" (
    "id"       TEXT        NOT NULL,
    "email"    TEXT        NOT NULL,
    "org_id"   TEXT        NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "allowlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "allowlist_org_id_email_key" ON "allowlist"("org_id", "email");
CREATE INDEX "allowlist_org_id_idx" ON "allowlist"("org_id");
ALTER TABLE "allowlist" ADD CONSTRAINT "allowlist_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

CREATE TABLE "allowed_domains" (
    "id"       TEXT        NOT NULL,
    "domain"   TEXT        NOT NULL,
    "org_id"   TEXT        NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "allowed_domains_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "allowed_domains_org_id_domain_key" ON "allowed_domains"("org_id", "domain");
CREATE INDEX "allowed_domains_org_id_idx" ON "allowed_domains"("org_id");
ALTER TABLE "allowed_domains" ADD CONSTRAINT "allowed_domains_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- ─── Employees ────────────────────────────────────────────────────────────────

CREATE TABLE "employees" (
    "id"             TEXT        NOT NULL,
    "org_id"         TEXT        NOT NULL,
    "name"           TEXT        NOT NULL,
    "email"          TEXT        NOT NULL,
    "employee_id"    TEXT,
    "department"     TEXT,
    "role"           TEXT,
    "is_admin"       BOOLEAN     NOT NULL DEFAULT false,
    "is_super_admin" BOOLEAN     NOT NULL DEFAULT false,
    "is_active"      BOOLEAN     NOT NULL DEFAULT true,
    "manager_id"     TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "employees_org_id_email_key"       ON "employees"("org_id", "email");
CREATE UNIQUE INDEX "employees_org_id_employee_id_key" ON "employees"("org_id", "employee_id");
CREATE INDEX "employees_org_id_idx" ON "employees"("org_id");
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey"
    FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL;

-- ─── Question Templates ───────────────────────────────────────────────────────

CREATE TABLE "question_templates" (
    "id"          TEXT        NOT NULL,
    "org_id"      TEXT        NOT NULL,
    "name"        TEXT        NOT NULL,
    "description" TEXT,
    "is_default"  BOOLEAN     NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "question_templates_org_id_idx" ON "question_templates"("org_id");
ALTER TABLE "question_templates" ADD CONSTRAINT "question_templates_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

CREATE TABLE "question_template_items" (
    "id"          TEXT          NOT NULL,
    "template_id" TEXT          NOT NULL,
    "text"        TEXT          NOT NULL,
    "type"        "QuestionType" NOT NULL,
    "rating_scale" INTEGER,
    "category"    TEXT          NOT NULL,
    "sort_order"  INTEGER       NOT NULL,
    CONSTRAINT "question_template_items_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "question_template_items" ADD CONSTRAINT "question_template_items_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "question_templates"("id") ON DELETE CASCADE;

-- ─── Review Cycles ────────────────────────────────────────────────────────────

CREATE TABLE "review_cycles" (
    "id"          TEXT          NOT NULL,
    "org_id"      TEXT          NOT NULL,
    "title"       TEXT          NOT NULL,
    "start_date"  TIMESTAMP(3)  NOT NULL,
    "end_date"    TIMESTAMP(3)  NOT NULL,
    "status"      "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "template_id" TEXT,
    "created_at"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_cycles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "review_cycles_org_id_idx" ON "review_cycles"("org_id");
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "question_templates"("id") ON DELETE SET NULL;

CREATE TABLE "cycle_questions" (
    "id"                     TEXT          NOT NULL,
    "cycle_id"               TEXT          NOT NULL,
    "source_template_item_id" TEXT,
    "text"                   TEXT          NOT NULL,
    "type"                   "QuestionType" NOT NULL,
    "rating_scale"           INTEGER,
    "category"               TEXT          NOT NULL,
    "sort_order"             INTEGER       NOT NULL,
    CONSTRAINT "cycle_questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cycle_questions_cycle_id_idx" ON "cycle_questions"("cycle_id");
ALTER TABLE "cycle_questions" ADD CONSTRAINT "cycle_questions_cycle_id_fkey"
    FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE;
ALTER TABLE "cycle_questions" ADD CONSTRAINT "cycle_questions_source_template_item_id_fkey"
    FOREIGN KEY ("source_template_item_id") REFERENCES "question_template_items"("id") ON DELETE SET NULL;

-- ─── Questions ────────────────────────────────────────────────────────────────

CREATE TABLE "questions" (
    "id"          TEXT          NOT NULL,
    "org_id"      TEXT          NOT NULL,
    "text"        TEXT          NOT NULL,
    "type"        "QuestionType" NOT NULL,
    "rating_scale" INTEGER,
    "category"    TEXT          NOT NULL,
    "sort_order"  INTEGER       NOT NULL,
    "is_active"   BOOLEAN       NOT NULL DEFAULT true,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "questions_org_id_sort_order_key" ON "questions"("org_id", "sort_order");
CREATE INDEX "questions_org_id_idx" ON "questions"("org_id");
ALTER TABLE "questions" ADD CONSTRAINT "questions_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- ─── Review Assignments & Responses ──────────────────────────────────────────

CREATE TABLE "review_assignments" (
    "id"           TEXT          NOT NULL,
    "cycle_id"     TEXT          NOT NULL,
    "reviewee_id"  TEXT          NOT NULL,
    "reviewer_id"  TEXT          NOT NULL,
    "relationship" "Relationship" NOT NULL,
    "submitted"    BOOLEAN       NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "review_assignments_cycle_id_reviewee_id_reviewer_id_key"
    ON "review_assignments"("cycle_id", "reviewee_id", "reviewer_id");
CREATE INDEX "review_assignments_cycle_id_reviewee_id_idx" ON "review_assignments"("cycle_id", "reviewee_id");
CREATE INDEX "review_assignments_reviewer_id_idx" ON "review_assignments"("reviewer_id");
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_cycle_id_fkey"
    FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE;
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_reviewee_id_fkey"
    FOREIGN KEY ("reviewee_id") REFERENCES "employees"("id");
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_reviewer_id_fkey"
    FOREIGN KEY ("reviewer_id") REFERENCES "employees"("id");

CREATE TABLE "review_responses" (
    "id"                TEXT          NOT NULL,
    "cycle_id"          TEXT          NOT NULL,
    "reviewee_id"       TEXT          NOT NULL,
    "question_id"       TEXT,
    "cycle_question_id" TEXT,
    "answer_encrypted"  TEXT          NOT NULL,
    "relationship"      "Relationship" NOT NULL,
    "created_at"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "review_responses_cycle_id_reviewee_id_idx" ON "review_responses"("cycle_id", "reviewee_id");
CREATE INDEX "review_responses_reviewee_id_idx" ON "review_responses"("reviewee_id");
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_cycle_id_fkey"
    FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE;
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_reviewee_id_fkey"
    FOREIGN KEY ("reviewee_id") REFERENCES "employees"("id");
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id");
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_cycle_question_id_fkey"
    FOREIGN KEY ("cycle_question_id") REFERENCES "cycle_questions"("id");

-- ─── Audit Log ────────────────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
    "id"          TEXT        NOT NULL,
    "org_id"      TEXT        NOT NULL,
    "actor_email" TEXT        NOT NULL,
    "action"      TEXT        NOT NULL,
    "target"      TEXT,
    "metadata"    TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_org_id_idx" ON "audit_logs"("org_id");
CREATE INDEX "audit_logs_org_id_created_at_idx" ON "audit_logs"("org_id", "created_at");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- ─── Settings ─────────────────────────────────────────────────────────────────

CREATE TABLE "settings" (
    "id"         TEXT        NOT NULL,
    "org_id"     TEXT        NOT NULL,
    "key"        TEXT        NOT NULL,
    "value"      TEXT        NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settings_org_id_key_key" ON "settings"("org_id", "key");
CREATE INDEX "settings_org_id_idx" ON "settings"("org_id");
ALTER TABLE "settings" ADD CONSTRAINT "settings_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
