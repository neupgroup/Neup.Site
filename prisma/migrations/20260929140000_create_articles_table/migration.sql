CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "imageUrl" TEXT,
    "metaDescription" TEXT,
    "language" TEXT,
    "tags" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "articles_projectId_publishedAt_idx" ON "articles"("projectId", "publishedAt");

ALTER TABLE "articles"
ADD CONSTRAINT "articles_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
