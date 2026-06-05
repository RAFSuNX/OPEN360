-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_org_id_idx" ON "audit_logs"("org_id");

-- CreateIndex
CREATE INDEX "audit_logs_org_id_created_at_idx" ON "audit_logs"("org_id", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
