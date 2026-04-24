-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "username" TEXT,
    "deploymentPath" TEXT,
    "storageAllocation" TEXT,
    "port" INTEGER,
    "allocatedStorage" INTEGER,
    "allocatedOn" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appBaseBackups" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "backedUpAt" TIMESTAMP(3),
    "backedUpBy" TEXT NOT NULL,

    CONSTRAINT "appBaseBackups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "status" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,

    CONSTRAINT "artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codeFiles" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "codeFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datalists" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "datalists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "structure" JSONB,
    "status" TEXT NOT NULL,
    "theme" JSONB,
    "redirects" JSONB,
    "siteProfile" JSONB,
    "environments" JSONB,
    "attemptedOn" TIMESTAMP(3),

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3),

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errors" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "componentStack" TEXT,
    "source" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "qualifications" JSONB,
    "salary" TEXT,
    "openings" INTEGER,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "hiring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linked_accounts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerUsername" TEXT NOT NULL,
    "authorized_on" TIMESTAMP(3),

    CONSTRAINT "linked_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "imageUrl" TEXT,
    "permissions" JSONB,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "slug" TEXT,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_data_sources" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,

    CONSTRAINT "page_data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "elements" JSONB,
    "reactComponent" TEXT,
    "type" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paths" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_on" TIMESTAMP(3),

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'json',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serverCommands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commandTemplate" TEXT NOT NULL,
    "parameters" JSONB,
    "preExecutionScript" TEXT,
    "allocatesPort" BOOLEAN NOT NULL DEFAULT false,
    "portToReserve" TEXT,
    "type" TEXT NOT NULL DEFAULT 'view',
    "danger" TEXT NOT NULL DEFAULT 'low',
    "nextCommands" JSONB,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "serverCommands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serverLogs" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "commandId" TEXT,
    "commandName" TEXT,
    "command" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "serverLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicIp" TEXT NOT NULL,
    "privateIp" TEXT,
    "privateKey" TEXT,
    "serverType" TEXT,
    "platform" TEXT,
    "provider" TEXT,
    "isPrivate" BOOLEAN,
    "username" TEXT,
    "basePath" TEXT,
    "appPath" TEXT,
    "storageUsed" TEXT,
    "storageTotal" TEXT,
    "storageUnit" TEXT,
    "serverConfigured" BOOLEAN NOT NULL DEFAULT false,
    "defaultNginxConfigStatus" TEXT,
    "createdOn" TIMESTAMP(3),
    "expiresOn" TIMESTAMP(3),
    "portsOpen" JSONB,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "logoUrl" TEXT,
    "hideSitename" BOOLEAN NOT NULL DEFAULT false,
    "hideLogo" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "socialProfiles" JSONB,
    "contactEmail" JSONB,
    "contactPhone" JSONB,
    "modules" JSONB,
    "theme" JSONB,
    "icons" JSONB,
    "domains" JSONB,
    "ownerAccountId" TEXT,
    "status" TEXT,
    "type" TEXT,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "methods" JSONB,
    "url" TEXT,
    "headers" JSONB,
    "connection" TEXT,
    "data" JSONB,
    "datalistId" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structure" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "structure" JSONB,
    "status" TEXT NOT NULL,
    "themeChanged" BOOLEAN NOT NULL DEFAULT false,
    "redirectsChanged" BOOLEAN NOT NULL DEFAULT false,
    "assetsChanged" BOOLEAN NOT NULL DEFAULT false,
    "appBaseChanged" BOOLEAN NOT NULL DEFAULT false,
    "environmentsChanged" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syncer_log" (
    "id" TEXT NOT NULL,
    "app_id" TEXT,
    "client_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_on" TIMESTAMP(3),
    "status" TEXT,

    CONSTRAINT "syncer_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL DEFAULT 'section',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "usableOn" JSONB,
    "content" JSONB,
    "createdBy" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MemberToTeam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberToTeam_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "allocations_siteId_serverId_idx" ON "allocations"("siteId", "serverId");

-- CreateIndex
CREATE INDEX "api_tokens_accountId_createdAt_idx" ON "api_tokens"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "appBaseBackups_siteId_backedUpAt_idx" ON "appBaseBackups"("siteId", "backedUpAt");

-- CreateIndex
CREATE INDEX "applicants_jobId_appliedAt_idx" ON "applicants"("jobId", "appliedAt");

-- CreateIndex
CREATE INDEX "codeFiles_siteId_createdAt_idx" ON "codeFiles"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "datalists_siteId_idx" ON "datalists"("siteId");

-- CreateIndex
CREATE INDEX "deployments_siteId_status_attemptedOn_idx" ON "deployments"("siteId", "status", "attemptedOn");

-- CreateIndex
CREATE INDEX "environments_siteId_createdOn_idx" ON "environments"("siteId", "createdOn");

-- CreateIndex
CREATE INDEX "errors_timestamp_idx" ON "errors"("timestamp");

-- CreateIndex
CREATE INDEX "linked_accounts_account_id_platform_idx" ON "linked_accounts"("account_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_account_id_platform_providerUserId_key" ON "linked_accounts"("account_id", "platform", "providerUserId");

-- CreateIndex
CREATE INDEX "page_data_sources_siteId_pageId_idx" ON "page_data_sources"("siteId", "pageId");

-- CreateIndex
CREATE INDEX "pages_siteId_idx" ON "pages"("siteId");

-- CreateIndex
CREATE INDEX "paths_pageId_idx" ON "paths"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "paths_siteId_path_key" ON "paths"("siteId", "path");

-- CreateIndex
CREATE INDEX "redirects_siteId_created_on_idx" ON "redirects"("siteId", "created_on");

-- CreateIndex
CREATE INDEX "sections_siteId_idx" ON "sections"("siteId");

-- CreateIndex
CREATE INDEX "serverLogs_serverId_initiatedAt_idx" ON "serverLogs"("serverId", "initiatedAt");

-- CreateIndex
CREATE INDEX "sites_ownerAccountId_idx" ON "sites"("ownerAccountId");

-- CreateIndex
CREATE INDEX "sources_siteId_idx" ON "sources"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "structure_siteId_key" ON "structure"("siteId");

-- CreateIndex
CREATE INDEX "syncer_log_app_id_client_id_type_created_on_idx" ON "syncer_log"("app_id", "client_id", "type", "created_on");

-- CreateIndex
CREATE INDEX "_MemberToTeam_B_index" ON "_MemberToTeam"("B");

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appBaseBackups" ADD CONSTRAINT "appBaseBackups_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "hiring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codeFiles" ADD CONSTRAINT "codeFiles_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datalists" ADD CONSTRAINT "datalists_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain" ADD CONSTRAINT "domain_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_data_sources" ADD CONSTRAINT "page_data_sources_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_data_sources" ADD CONSTRAINT "page_data_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paths" ADD CONSTRAINT "paths_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paths" ADD CONSTRAINT "paths_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redirects" ADD CONSTRAINT "redirects_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serverLogs" ADD CONSTRAINT "serverLogs_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure" ADD CONSTRAINT "structure_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberToTeam" ADD CONSTRAINT "_MemberToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberToTeam" ADD CONSTRAINT "_MemberToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
