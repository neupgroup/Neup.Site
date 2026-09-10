/* Adds lifecycle visibility status to project members. */
ALTER TABLE "members" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
