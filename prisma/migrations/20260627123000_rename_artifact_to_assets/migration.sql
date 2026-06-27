DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'artifact'
  ) THEN
    ALTER TABLE "artifact" RENAME TO "assets";
  END IF;
END $$;

DO $$
DECLARE
  target_table_name text;
BEGIN
  FOREACH target_table_name IN ARRAY ARRAY[
    'role',
    'domain',
    'profile',
    'pages',
    'paths',
    'sections',
    'sources',
    'page_data_sources',
    'datalists',
    'redirects',
    'environments',
    'structure',
    'deployments',
    'allocations',
    'codeFiles',
    'appBaseBackups',
    'modules'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = target_table_name
        AND column_name = 'artifactId'
    ) THEN
      EXECUTE format('ALTER TABLE %I RENAME COLUMN "artifactId" TO "assetId"', target_table_name);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'artifact_pkey') THEN
    ALTER INDEX "artifact_pkey" RENAME TO "assets_pkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'artifact_ownerAccountId_idx') THEN
    ALTER INDEX "artifact_ownerAccountId_idx" RENAME TO "assets_ownerAccountId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profile_artifactId_idx') THEN
    ALTER INDEX "profile_artifactId_idx" RENAME TO "profile_assetId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profile_artifactId_subject_idx') THEN
    ALTER INDEX "profile_artifactId_subject_idx" RENAME TO "profile_assetId_subject_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'pages_artifactId_idx') THEN
    ALTER INDEX "pages_artifactId_idx" RENAME TO "pages_assetId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'paths_artifactId_path_key') THEN
    ALTER INDEX "paths_artifactId_path_key" RENAME TO "paths_assetId_path_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sections_artifactId_idx') THEN
    ALTER INDEX "sections_artifactId_idx" RENAME TO "sections_assetId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sources_artifactId_idx') THEN
    ALTER INDEX "sources_artifactId_idx" RENAME TO "sources_assetId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'page_data_sources_artifactId_pageId_idx') THEN
    ALTER INDEX "page_data_sources_artifactId_pageId_idx" RENAME TO "page_data_sources_assetId_pageId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'datalists_artifactId_idx') THEN
    ALTER INDEX "datalists_artifactId_idx" RENAME TO "datalists_assetId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'redirects_artifactId_created_on_idx') THEN
    ALTER INDEX "redirects_artifactId_created_on_idx" RENAME TO "redirects_assetId_created_on_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'environments_artifactId_createdOn_idx') THEN
    ALTER INDEX "environments_artifactId_createdOn_idx" RENAME TO "environments_assetId_createdOn_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'structure_artifactId_key') THEN
    ALTER INDEX "structure_artifactId_key" RENAME TO "structure_assetId_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'deployments_artifactId_status_attemptedOn_idx') THEN
    ALTER INDEX "deployments_artifactId_status_attemptedOn_idx" RENAME TO "deployments_assetId_status_attemptedOn_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'allocations_artifactId_serverId_idx') THEN
    ALTER INDEX "allocations_artifactId_serverId_idx" RENAME TO "allocations_assetId_serverId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'codeFiles_artifactId_createdAt_idx') THEN
    ALTER INDEX "codeFiles_artifactId_createdAt_idx" RENAME TO "codeFiles_assetId_createdAt_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'appBaseBackups_artifactId_backedUpAt_idx') THEN
    ALTER INDEX "appBaseBackups_artifactId_backedUpAt_idx" RENAME TO "appBaseBackups_assetId_backedUpAt_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'modules_artifactId_idx') THEN
    ALTER INDEX "modules_artifactId_idx" RENAME TO "modules_assetId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_artifactId_fkey') THEN
    ALTER TABLE "role" RENAME CONSTRAINT "role_artifactId_fkey" TO "role_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'domain_artifactId_fkey') THEN
    ALTER TABLE "domain" RENAME CONSTRAINT "domain_artifactId_fkey" TO "domain_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_artifactId_fkey') THEN
    ALTER TABLE "profile" RENAME CONSTRAINT "profile_artifactId_fkey" TO "profile_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_artifactId_fkey') THEN
    ALTER TABLE "pages" RENAME CONSTRAINT "pages_artifactId_fkey" TO "pages_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'paths_artifactId_fkey') THEN
    ALTER TABLE "paths" RENAME CONSTRAINT "paths_artifactId_fkey" TO "paths_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sections_artifactId_fkey') THEN
    ALTER TABLE "sections" RENAME CONSTRAINT "sections_artifactId_fkey" TO "sections_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sources_artifactId_fkey') THEN
    ALTER TABLE "sources" RENAME CONSTRAINT "sources_artifactId_fkey" TO "sources_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'datalists_artifactId_fkey') THEN
    ALTER TABLE "datalists" RENAME CONSTRAINT "datalists_artifactId_fkey" TO "datalists_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redirects_artifactId_fkey') THEN
    ALTER TABLE "redirects" RENAME CONSTRAINT "redirects_artifactId_fkey" TO "redirects_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environments_artifactId_fkey') THEN
    ALTER TABLE "environments" RENAME CONSTRAINT "environments_artifactId_fkey" TO "environments_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'structure_artifactId_fkey') THEN
    ALTER TABLE "structure" RENAME CONSTRAINT "structure_artifactId_fkey" TO "structure_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deployments_artifactId_fkey') THEN
    ALTER TABLE "deployments" RENAME CONSTRAINT "deployments_artifactId_fkey" TO "deployments_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'allocations_artifactId_fkey') THEN
    ALTER TABLE "allocations" RENAME CONSTRAINT "allocations_artifactId_fkey" TO "allocations_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'codeFiles_artifactId_fkey') THEN
    ALTER TABLE "codeFiles" RENAME CONSTRAINT "codeFiles_artifactId_fkey" TO "codeFiles_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appBaseBackups_artifactId_fkey') THEN
    ALTER TABLE "appBaseBackups" RENAME CONSTRAINT "appBaseBackups_artifactId_fkey" TO "appBaseBackups_assetId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'modules_artifactId_fkey') THEN
    ALTER TABLE "modules" RENAME CONSTRAINT "modules_artifactId_fkey" TO "modules_assetId_fkey";
  END IF;
END $$;
