/*
::neup.documentation::add-team-slug-migration

::public

Adds a persisted `slug` column to project teams, backfills existing rows, and
enforces uniqueness per project.

::public end
::end
*/

ALTER TABLE "teams" ADD COLUMN "slug" TEXT;

WITH normalized AS (
  SELECT
    "id",
    "asset_id",
    COALESCE(
      NULLIF(
        BTRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(LOWER("name"), '[^a-z0-9]+', '-', 'g'),
            '-+',
            '-',
            'g'
          ),
          '-'
        ),
        ''
      ),
      'team'
    ) AS "base_slug"
  FROM "teams"
),
ranked AS (
  SELECT
    "id",
    "base_slug",
    ROW_NUMBER() OVER (
      PARTITION BY "asset_id", "base_slug"
      ORDER BY "id"
    ) AS "slug_index"
  FROM normalized
)
UPDATE "teams" AS "t"
SET "slug" = CASE
  WHEN ranked."slug_index" = 1 THEN ranked."base_slug"
  ELSE ranked."base_slug" || '-' || ranked."slug_index"
END
FROM ranked
WHERE ranked."id" = "t"."id";

ALTER TABLE "teams" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "teams_asset_id_slug_key" ON "teams"("asset_id", "slug");
