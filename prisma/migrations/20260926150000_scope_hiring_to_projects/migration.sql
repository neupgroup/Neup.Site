ALTER TABLE "hiring" ADD COLUMN "projectId" TEXT;

CREATE INDEX "hiring_projectId_createdAt_idx" ON "hiring"("projectId", "createdAt");

ALTER TABLE "hiring" ADD CONSTRAINT "hiring_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
