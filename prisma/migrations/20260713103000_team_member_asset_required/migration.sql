/*
::neup.documentation::team-member-asset-required-migration

::public

Backfills legacy team and member rows without an asset owner to the provided
asset and then enforces `asset_id` as required for both tables.

::public end
::end
*/

UPDATE "teams"
SET "asset_id" = '2f7c620b-2038-460e-ac48-995310c4b2a0'
WHERE "asset_id" IS NULL;

UPDATE "members"
SET "asset_id" = '2f7c620b-2038-460e-ac48-995310c4b2a0'
WHERE "asset_id" IS NULL;

ALTER TABLE "teams"
ALTER COLUMN "asset_id" SET NOT NULL;

ALTER TABLE "members"
ALTER COLUMN "asset_id" SET NOT NULL;
