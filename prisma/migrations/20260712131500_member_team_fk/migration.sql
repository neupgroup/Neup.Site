/*
::neup.documentation::member-team-fk-migration

::public

Converts member-to-team storage from a join table to a nullable `team_id`
foreign key on members while preserving the first existing assignment.

::public end
::end
*/

ALTER TABLE "members" ADD COLUMN "team_id" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = '_MemberToTeam'
  ) THEN
    UPDATE "members" AS "m"
    SET "team_id" = "picked"."team_id"
    FROM (
      SELECT DISTINCT ON ("A") "A" AS "member_id", "B" AS "team_id"
      FROM "_MemberToTeam"
      ORDER BY "A", "B"
    ) AS "picked"
    WHERE "m"."id" = "picked"."member_id"
      AND "m"."team_id" IS NULL;
  END IF;
END $$;

CREATE INDEX "members_team_id_order_idx" ON "members"("team_id", "order");

ALTER TABLE "members"
ADD CONSTRAINT "members_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

DROP TABLE IF EXISTS "_MemberToTeam";
