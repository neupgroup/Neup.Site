ALTER TABLE "accounts" RENAME COLUMN "defaultProject" TO "lastProject";

ALTER TABLE "accounts" DROP CONSTRAINT "accounts_defaultProject_fkey";
ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_lastProject_fkey"
  FOREIGN KEY ("lastProject") REFERENCES "projects"("id") ON DELETE SET NULL;

ALTER INDEX "accounts_defaultProject_idx" RENAME TO "accounts_lastProject_idx";
