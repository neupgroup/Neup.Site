/*
  Move legacy profile-related columns off `artifact` into the new `profile` table.

  Subjects:
  - brand.logo           <- artifact.logoUrl
  - brand.description    <- artifact.description
  - contact.email        <- artifact.contactEmail (json array)
  - contact.phone        <- artifact.contactPhone (json array)
  - socialProfile.<key>  <- artifact.socialProfiles (json array of {platformName,url})
*/

BEGIN;

-- Backfill brand.logo (only if not already present in profile)
INSERT INTO "profile" ("id", "artifactId", "subject", "value")
SELECT
  concat('prof_', md5(random()::text || clock_timestamp()::text || a."id" || 'brand.logo')),
  a."id",
  'brand.logo',
  LEFT(a."logoUrl", 512)
FROM "artifact" a
WHERE a."logoUrl" IS NOT NULL
  AND a."logoUrl" <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "profile" p
    WHERE p."artifactId" = a."id" AND p."subject" = 'brand.logo'
  );

-- Backfill brand.description (only if not already present in profile)
INSERT INTO "profile" ("id", "artifactId", "subject", "value")
SELECT
  concat('prof_', md5(random()::text || clock_timestamp()::text || a."id" || 'brand.description')),
  a."id",
  'brand.description',
  LEFT(a."description", 512)
FROM "artifact" a
WHERE a."description" IS NOT NULL
  AND a."description" <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "profile" p
    WHERE p."artifactId" = a."id" AND p."subject" = 'brand.description'
  );

-- Backfill contact.email (only if none exist yet for this artifact)
INSERT INTO "profile" ("id", "artifactId", "subject", "value")
SELECT
  concat('prof_', md5(random()::text || clock_timestamp()::text || a."id" || 'contact.email' || elem::text)),
  a."id",
  'contact.email',
  LEFT(
    NULLIF(
      CASE
        WHEN jsonb_typeof(elem) = 'object' THEN COALESCE(elem->>'value', '')
        WHEN jsonb_typeof(elem) = 'string' THEN trim(both '"' from elem::text)
        ELSE ''
      END,
      ''
    ),
    512
  )
FROM "artifact" a
JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(a."contactEmail") = 'array' THEN a."contactEmail"
    ELSE '[]'::jsonb
  END
) elem ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM "profile" p
    WHERE p."artifactId" = a."id" AND p."subject" = 'contact.email'
  )
  AND (
    CASE
      WHEN jsonb_typeof(elem) = 'object' THEN COALESCE(elem->>'value', '')
      WHEN jsonb_typeof(elem) = 'string' THEN trim(both '"' from elem::text)
      ELSE ''
    END
  ) <> '';

-- Backfill contact.phone (only if none exist yet for this artifact)
INSERT INTO "profile" ("id", "artifactId", "subject", "value")
SELECT
  concat('prof_', md5(random()::text || clock_timestamp()::text || a."id" || 'contact.phone' || elem::text)),
  a."id",
  'contact.phone',
  LEFT(
    NULLIF(
      CASE
        WHEN jsonb_typeof(elem) = 'object' THEN COALESCE(elem->>'value', '')
        WHEN jsonb_typeof(elem) = 'string' THEN trim(both '"' from elem::text)
        ELSE ''
      END,
      ''
    ),
    512
  )
FROM "artifact" a
JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(a."contactPhone") = 'array' THEN a."contactPhone"
    ELSE '[]'::jsonb
  END
) elem ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM "profile" p
    WHERE p."artifactId" = a."id" AND p."subject" = 'contact.phone'
  )
  AND (
    CASE
      WHEN jsonb_typeof(elem) = 'object' THEN COALESCE(elem->>'value', '')
      WHEN jsonb_typeof(elem) = 'string' THEN trim(both '"' from elem::text)
      ELSE ''
    END
  ) <> '';

-- Backfill socialProfile.<platformKey> (only if none exist yet for this artifact)
INSERT INTO "profile" ("id", "artifactId", "subject", "value")
SELECT
  concat('prof_', md5(random()::text || clock_timestamp()::text || a."id" || 'socialProfile' || elem::text)),
  a."id",
  ('socialProfile.' || platform_key),
  LEFT(COALESCE(elem->>'url', ''), 512)
FROM "artifact" a
JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(a."socialProfiles") = 'array' THEN a."socialProfiles"
    ELSE '[]'::jsonb
  END
) elem ON TRUE
JOIN LATERAL (
  SELECT regexp_replace(lower(COALESCE(elem->>'platformName', '')), '[^a-z0-9]+', '', 'g') AS platform_key
) key ON TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM "profile" p
    WHERE p."artifactId" = a."id" AND p."subject" LIKE 'socialProfile.%'
  )
  AND key.platform_key <> ''
  AND COALESCE(elem->>'url', '') <> '';

-- Drop legacy columns from `artifact`
ALTER TABLE "artifact" DROP COLUMN "socialProfiles";
ALTER TABLE "artifact" DROP COLUMN "contactEmail";
ALTER TABLE "artifact" DROP COLUMN "contactPhone";
ALTER TABLE "artifact" DROP COLUMN "logoUrl";
ALTER TABLE "artifact" DROP COLUMN "description";

COMMIT;

