CREATE TABLE "forms" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "fields" JSONB NOT NULL,
  "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "formSubmissions" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "response" JSONB NOT NULL,
  "postedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(16) NOT NULL,
  CONSTRAINT "formSubmissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "forms_projectId_slug_key" ON "forms"("projectId", "slug");
CREATE INDEX "forms_projectId_createdOn_idx" ON "forms"("projectId", "createdOn");
CREATE INDEX "formSubmissions_projectId_postedOn_idx" ON "formSubmissions"("projectId", "postedOn");
CREATE INDEX "formSubmissions_formId_postedOn_idx" ON "formSubmissions"("formId", "postedOn");
ALTER TABLE "forms" ADD CONSTRAINT "forms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "formSubmissions" ADD CONSTRAINT "formSubmissions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "formSubmissions" ADD CONSTRAINT "formSubmissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
