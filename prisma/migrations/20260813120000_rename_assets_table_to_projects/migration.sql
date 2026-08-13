DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assets'
  ) THEN
    ALTER TABLE "assets" RENAME TO "projects";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'assets_pkey') THEN
    ALTER INDEX "assets_pkey" RENAME TO "projects_pkey";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'assets_ownerAccountId_idx') THEN
    ALTER INDEX "assets_ownerAccountId_idx" RENAME TO "projects_ownerAccountId_idx";
  END IF;
END $$;
