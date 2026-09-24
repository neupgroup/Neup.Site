ALTER TABLE "accounts" ADD COLUMN "defaultProject" TEXT;

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_defaultProject_fkey"
FOREIGN KEY ("defaultProject") REFERENCES "projects"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "accounts_defaultProject_idx" ON "accounts"("defaultProject");
