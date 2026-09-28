ALTER TABLE "news" ADD COLUMN "projectId" TEXT;

CREATE INDEX "news_projectId_publishedAt_idx" ON "news"("projectId", "publishedAt");

ALTER TABLE "news"
ADD CONSTRAINT "news_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
