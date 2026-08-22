ALTER TABLE "public"."account" RENAME TO "accounts";

ALTER TABLE "public"."accounts"
ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "displayImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN "neupId" TEXT,
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'individual',
ADD COLUMN "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "moreDetails" JSONB;

CREATE UNIQUE INDEX "accounts_neupId_key" ON "public"."accounts"("neupId");
