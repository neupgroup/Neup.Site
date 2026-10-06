CREATE TABLE "block_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" VARCHAR(24) NOT NULL,
    "media" JSONB,
    "type" TEXT NOT NULL DEFAULT 'page',
    "description" TEXT,
    "version" TEXT,
    "payload" JSONB,
    "code" TEXT,
    "compatibility" JSONB,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "block_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "templateId" TEXT,
    "payload" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "blocks_projectId_idx" ON "blocks"("projectId");
CREATE INDEX "blocks_templateId_idx" ON "blocks"("templateId");

ALTER TABLE "blocks" ADD CONSTRAINT "blocks_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blocks" ADD CONSTRAINT "blocks_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "block_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
