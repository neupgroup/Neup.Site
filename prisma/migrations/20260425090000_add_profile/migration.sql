-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "value" VARCHAR(512) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_artifactId_idx" ON "profile"("artifactId");

-- CreateIndex
CREATE INDEX "profile_artifactId_subject_idx" ON "profile"("artifactId", "subject");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
