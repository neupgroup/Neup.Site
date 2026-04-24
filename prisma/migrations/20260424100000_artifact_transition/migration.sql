/*
  This migration transitions the existing DB from legacy `sites`-based relations
  to the new `artifact` + `theme` structure, while preserving existing data.

  Key points:
  - Adds `artifactId` columns, backfills from legacy `siteId`, then drops `siteId`.
  - Copies data from `sites` into `artifact` and `theme`, then drops `sites`.
*/

BEGIN;

-- 1) Prepare `artifact` table to match the new Prisma model
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'artifact'
      AND column_name = 'logo'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'artifact'
      AND column_name = 'logoUrl'
  )
  THEN
    ALTER TABLE "artifact" RENAME COLUMN "logo" TO "logoUrl";
  END IF;
END $$;

ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "url" TEXT;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "socialProfiles" JSONB;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "contactEmail" JSONB;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "contactPhone" JSONB;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "modules" JSONB;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "icons" JSONB;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "domains" JSONB;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "ownerAccountId" TEXT;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "artifact" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

ALTER TABLE "artifact" ALTER COLUMN "name" SET DEFAULT '';

-- 2) Create new tables added in the Prisma schema
CREATE TABLE IF NOT EXISTS "theme" (
    "id" TEXT NOT NULL,
    "hideSitename" BOOLEAN NOT NULL DEFAULT false,
    "hideLogo" BOOLEAN NOT NULL DEFAULT false,
    "theme" JSONB,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "theme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sync_request" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptOn" TIMESTAMP(3),

    CONSTRAINT "sync_request_pkey" PRIMARY KEY ("id")
);

-- 3) Copy legacy `sites` data into `artifact` and `theme`
INSERT INTO "artifact" (
  "id",
  "name",
  "url",
  "tier",
  "logoUrl",
  "description",
  "socialProfiles",
  "contactEmail",
  "contactPhone",
  "modules",
  "icons",
  "domains",
  "ownerAccountId",
  "status",
  "type",
  "createdAt",
  "updatedAt"
)
SELECT
  s."id",
  COALESCE(s."name", ''),
  s."url",
  COALESCE(s."tier", 'free'),
  s."logoUrl",
  s."description",
  s."socialProfiles",
  s."contactEmail",
  s."contactPhone",
  s."modules",
  s."icons",
  s."domains",
  s."ownerAccountId",
  s."status",
  s."type",
  NULL,
  NULL
FROM "sites" s
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "url" = EXCLUDED."url",
  "tier" = EXCLUDED."tier",
  "logoUrl" = COALESCE(EXCLUDED."logoUrl", "artifact"."logoUrl"),
  "description" = COALESCE(EXCLUDED."description", "artifact"."description"),
  "socialProfiles" = COALESCE(EXCLUDED."socialProfiles", "artifact"."socialProfiles"),
  "contactEmail" = COALESCE(EXCLUDED."contactEmail", "artifact"."contactEmail"),
  "contactPhone" = COALESCE(EXCLUDED."contactPhone", "artifact"."contactPhone"),
  "modules" = COALESCE(EXCLUDED."modules", "artifact"."modules"),
  "icons" = COALESCE(EXCLUDED."icons", "artifact"."icons"),
  "domains" = COALESCE(EXCLUDED."domains", "artifact"."domains"),
  "ownerAccountId" = COALESCE(EXCLUDED."ownerAccountId", "artifact"."ownerAccountId"),
  "status" = COALESCE(EXCLUDED."status", "artifact"."status"),
  "type" = COALESCE(EXCLUDED."type", "artifact"."type");

INSERT INTO "theme" ("id", "hideSitename", "hideLogo", "theme", "createdAt", "updatedAt")
SELECT
  s."id",
  COALESCE(s."hideSitename", FALSE),
  COALESCE(s."hideLogo", FALSE),
  s."theme",
  NULL,
  NULL
FROM "sites" s
ON CONFLICT ("id") DO UPDATE SET
  "hideSitename" = EXCLUDED."hideSitename",
  "hideLogo" = EXCLUDED."hideLogo",
  "theme" = COALESCE(EXCLUDED."theme", "theme"."theme");

-- 4) Add & backfill `artifactId` columns (nullable -> backfill -> NOT NULL)
ALTER TABLE "allocations" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "allocations" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "allocations" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "appBaseBackups" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "appBaseBackups" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "appBaseBackups" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "codeFiles" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "codeFiles" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "codeFiles" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "datalists" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "datalists" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "datalists" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "deployments" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "deployments" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "deployments" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "environments" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "environments" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "environments" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "page_data_sources" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "page_data_sources" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "page_data_sources" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "pages" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "pages" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "paths" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "paths" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "paths" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "redirects" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "redirects" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "redirects" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "sections" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "sections" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "sources" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "sources" ALTER COLUMN "artifactId" SET NOT NULL;

ALTER TABLE "structure" ADD COLUMN IF NOT EXISTS "artifactId" TEXT;
UPDATE "structure" SET "artifactId" = "siteId" WHERE "artifactId" IS NULL;
ALTER TABLE "structure" ALTER COLUMN "artifactId" SET NOT NULL;

-- 5) Drop legacy foreign keys and indexes that depend on `siteId`
ALTER TABLE "allocations" DROP CONSTRAINT IF EXISTS "allocations_siteId_fkey";
ALTER TABLE "appBaseBackups" DROP CONSTRAINT IF EXISTS "appBaseBackups_siteId_fkey";
ALTER TABLE "codeFiles" DROP CONSTRAINT IF EXISTS "codeFiles_siteId_fkey";
ALTER TABLE "datalists" DROP CONSTRAINT IF EXISTS "datalists_siteId_fkey";
ALTER TABLE "deployments" DROP CONSTRAINT IF EXISTS "deployments_siteId_fkey";
ALTER TABLE "environments" DROP CONSTRAINT IF EXISTS "environments_siteId_fkey";
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_siteId_fkey";
ALTER TABLE "paths" DROP CONSTRAINT IF EXISTS "paths_siteId_fkey";
ALTER TABLE "redirects" DROP CONSTRAINT IF EXISTS "redirects_siteId_fkey";
ALTER TABLE "sections" DROP CONSTRAINT IF EXISTS "sections_siteId_fkey";
ALTER TABLE "sources" DROP CONSTRAINT IF EXISTS "sources_siteId_fkey";
ALTER TABLE "structure" DROP CONSTRAINT IF EXISTS "structure_siteId_fkey";

DROP INDEX IF EXISTS "allocations_siteId_serverId_idx";
DROP INDEX IF EXISTS "appBaseBackups_siteId_backedUpAt_idx";
DROP INDEX IF EXISTS "codeFiles_siteId_createdAt_idx";
DROP INDEX IF EXISTS "datalists_siteId_idx";
DROP INDEX IF EXISTS "deployments_siteId_status_attemptedOn_idx";
DROP INDEX IF EXISTS "environments_siteId_createdOn_idx";
DROP INDEX IF EXISTS "page_data_sources_siteId_pageId_idx";
DROP INDEX IF EXISTS "pages_siteId_idx";
DROP INDEX IF EXISTS "paths_siteId_path_key";
DROP INDEX IF EXISTS "redirects_siteId_created_on_idx";
DROP INDEX IF EXISTS "sections_siteId_idx";
DROP INDEX IF EXISTS "sources_siteId_idx";
DROP INDEX IF EXISTS "structure_siteId_key";

-- 6) Drop legacy `siteId` columns and the `sites` table
ALTER TABLE "allocations" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "appBaseBackups" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "codeFiles" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "datalists" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "deployments" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "environments" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "page_data_sources" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "paths" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "redirects" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "sections" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "sources" DROP COLUMN IF EXISTS "siteId";
ALTER TABLE "structure" DROP COLUMN IF EXISTS "siteId";

DROP TABLE IF EXISTS "sites";

-- 7) Add indexes expected by the new schema
CREATE INDEX IF NOT EXISTS "allocations_artifactId_serverId_idx" ON "allocations"("artifactId", "serverId");
CREATE INDEX IF NOT EXISTS "appBaseBackups_artifactId_backedUpAt_idx" ON "appBaseBackups"("artifactId", "backedUpAt");
CREATE INDEX IF NOT EXISTS "artifact_ownerAccountId_idx" ON "artifact"("ownerAccountId");
CREATE INDEX IF NOT EXISTS "codeFiles_artifactId_createdAt_idx" ON "codeFiles"("artifactId", "createdAt");
CREATE INDEX IF NOT EXISTS "datalists_artifactId_idx" ON "datalists"("artifactId");
CREATE INDEX IF NOT EXISTS "deployments_artifactId_status_attemptedOn_idx" ON "deployments"("artifactId", "status", "attemptedOn");
CREATE INDEX IF NOT EXISTS "environments_artifactId_createdOn_idx" ON "environments"("artifactId", "createdOn");
CREATE INDEX IF NOT EXISTS "page_data_sources_artifactId_pageId_idx" ON "page_data_sources"("artifactId", "pageId");
CREATE INDEX IF NOT EXISTS "pages_artifactId_idx" ON "pages"("artifactId");
CREATE UNIQUE INDEX IF NOT EXISTS "paths_artifactId_path_key" ON "paths"("artifactId", "path");
CREATE INDEX IF NOT EXISTS "redirects_artifactId_created_on_idx" ON "redirects"("artifactId", "created_on");
CREATE INDEX IF NOT EXISTS "sections_artifactId_idx" ON "sections"("artifactId");
CREATE INDEX IF NOT EXISTS "sources_artifactId_idx" ON "sources"("artifactId");
CREATE UNIQUE INDEX IF NOT EXISTS "structure_artifactId_key" ON "structure"("artifactId");

-- 8) Add foreign keys expected by the new schema
ALTER TABLE "theme" ADD CONSTRAINT "theme_id_fkey" FOREIGN KEY ("id") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pages" ADD CONSTRAINT "pages_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paths" ADD CONSTRAINT "paths_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sources" ADD CONSTRAINT "sources_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "datalists" ADD CONSTRAINT "datalists_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "redirects" ADD CONSTRAINT "redirects_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "environments" ADD CONSTRAINT "environments_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "structure" ADD CONSTRAINT "structure_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "codeFiles" ADD CONSTRAINT "codeFiles_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appBaseBackups" ADD CONSTRAINT "appBaseBackups_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

