CREATE TABLE "settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- Default: anonymity threshold = 1 (show all results)
INSERT INTO "settings" ("key", "value") VALUES ('anonymity_threshold', '1');
