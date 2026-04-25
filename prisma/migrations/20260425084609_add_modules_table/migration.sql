-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "modules_artifactId_idx" ON "modules"("artifactId");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
