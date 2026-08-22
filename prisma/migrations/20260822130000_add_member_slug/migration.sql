/*
::neup.documentation::add-member-slug-migration

::public

Adds a persisted `slug` column to project members, backfills existing rows, and
enforces uniqueness per project.

::public end
::end
*/

ALTER TABLE "members" ADD COLUMN "slug" TEXT;

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
      'member'
    ) AS "base_slug"
  FROM "members"
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
UPDATE "members" AS "m"
SET "slug" = CASE
  WHEN ranked."slug_index" = 1 THEN ranked."base_slug"
  ELSE ranked."base_slug" || '-' || ranked."slug_index"
END
FROM ranked
WHERE ranked."id" = "m"."id";

ALTER TABLE "members" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "members_asset_id_slug_key" ON "members"("asset_id", "slug");
