CREATE TABLE "allowed_domains" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "allowed_domains_domain_key" ON "allowed_domains"("domain");
