INSERT INTO "settings" ("key", "value") VALUES ('org_logo_email', '')
ON CONFLICT ("key") DO NOTHING;
