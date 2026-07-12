/*
::neup.documentation::team-member-asset-fk-migration

::public

Adds nullable `asset_id` ownership columns to teams and members so these
records can be scoped per asset. Existing rows are backfilled when the
database currently has exactly one asset.

::public end
::end
*/

ALTER TABLE "teams" ADD COLUMN "asset_id" TEXT;
ALTER TABLE "members" ADD COLUMN "asset_id" TEXT;

DO $$
DECLARE
  only_asset_id TEXT;
BEGIN
  IF (SELECT COUNT(*) FROM "assets") = 1 THEN
    SELECT "id" INTO only_asset_id FROM "assets" LIMIT 1;

    UPDATE "teams"
    SET "asset_id" = only_asset_id
    WHERE "asset_id" IS NULL;

    UPDATE "members"
    SET "asset_id" = only_asset_id
    WHERE "asset_id" IS NULL;
  END IF;
END $$;

CREATE INDEX "teams_asset_id_order_idx" ON "teams"("asset_id", "order");
CREATE INDEX "members_asset_id_team_id_order_idx" ON "members"("asset_id", "team_id", "order");

ALTER TABLE "teams"
ADD CONSTRAINT "teams_asset_id_fkey"
FOREIGN KEY ("asset_id") REFERENCES "assets"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "members"
ADD CONSTRAINT "members_asset_id_fkey"
FOREIGN KEY ("asset_id") REFERENCES "assets"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
