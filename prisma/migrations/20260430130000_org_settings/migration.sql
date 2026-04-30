INSERT INTO "settings" ("key", "value") VALUES
  ('org_name', ''),
  ('org_logo_url', ''),
  ('org_tagline', ''),
  ('onboarding_complete', 'false')
ON CONFLICT ("key") DO NOTHING;
