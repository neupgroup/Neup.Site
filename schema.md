# Database Tables

Source: prisma/schema.prisma

## account (Account)
Columns:
- id: String; primary key

## artifact (Artifact)
Columns:
- id: String; primary key
- name: String; default ""
- url: String?
- tier: String; default "free"
- modules: Json?
- icons: Json?
- domains: Json?
- ownerAccountId: String?
- status: String?
- type: String?
- createdAt: DateTime?
- updatedAt: DateTime?
Indexes:
- index (ownerAccountId)

## theme (Theme)
Columns:
- id: String; primary key; references Artifact.id
- hideSitename: Boolean; default false
- hideLogo: Boolean; default false
- theme: Json?
- createdAt: DateTime?
- updatedAt: DateTime?

## profile (Profile)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- subject: String
- value: String; varchar(512)
Indexes:
- index (artifactId)
- index (artifactId, subject)

## role (Role)
Columns:
- id: String; primary key
- artifactId: String; references Artifact.id
- portfolioId: String
- accountId: String; references Account.id
- role: String

## domain (Domain)
Columns:
- id: String; primary key
- artifactId: String; references Artifact.id
- domain: String
- isPrimary: Boolean

## pages (Page)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- name: String; default ""
- elements: Json?
- reactComponent: String?
- type: String; default "editor"
- createdAt: DateTime?
- updatedAt: DateTime?
Indexes:
- index (artifactId)

## paths (PagePath)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- pageId: String; references Page.id
- path: String
- createdAt: DateTime?
Indexes:
- unique (artifactId, path)
- index (pageId)

## sections (Section)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- name: String
- type: String
- content: String
- source: String; default "json"
- createdBy: String
- createdAt: DateTime?
Indexes:
- index (artifactId)

## templates (Template)
Columns:
- id: String; primary key; default cuid()
- name: String
- description: String?
- imageUrl: String?
- previewUrl: String?
- category: String?
- type: String; default "section"
- status: String; default "draft"
- usableOn: Json?
- content: Json?
- createdBy: String; default "user"
- createdAt: DateTime?

## sources (DataSource)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- name: String
- type: String
- methods: Json?
- url: String?
- headers: Json?
- connection: String?
- data: Json?
- datalistId: String?
- createdAt: DateTime?
Indexes:
- index (artifactId)

## page_data_sources (PageDataSourceBinding)
Columns:
- id: String; primary key
- artifactId: String
- pageId: String; references Page.id
- sourceId: String; references DataSource.id
- methodName: String
Indexes:
- index (artifactId, pageId)

## datalists (Datalist)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- name: String
- data: String
- createdAt: DateTime?
- updatedAt: DateTime?
Indexes:
- index (artifactId)

## redirects (Redirect)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- from: String
- to: String
- type: String
- created_by: String
- created_on: DateTime?
Indexes:
- index (artifactId, created_on)

## environments (EnvironmentVariable)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- name: String
- value: String
- dataType: String
- isPrivate: Boolean; default false
- createdBy: String
- createdOn: DateTime?
Indexes:
- index (artifactId, createdOn)

## structure (SiteStructure)
Columns:
- id: String; primary key
- artifactId: String; unique; references Artifact.id
- structure: Json?
- status: String
- themeChanged: Boolean; default false
- redirectsChanged: Boolean; default false
- assetsChanged: Boolean; default false
- appBaseChanged: Boolean; default false
- environmentsChanged: Boolean; default false
- updatedAt: DateTime?

## deployments (Deployment)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- structure: Json?
- status: String
- theme: Json?
- redirects: Json?
- siteProfile: Json?
- environments: Json?
- attemptedOn: DateTime?
Indexes:
- index (artifactId, status, attemptedOn)

## servers (Server)
Columns:
- id: String; primary key; default cuid()
- name: String
- publicIp: String
- privateIp: String?
- privateKey: String?
- serverType: String?
- platform: String?
- provider: String?
- isPrivate: Boolean?
- username: String?
- basePath: String?
- appPath: String?
- storageUsed: String?
- storageTotal: String?
- storageUnit: String?
- portsOpen: Json?
- serverConfigured: Boolean; default false
- defaultNginxConfigStatus: String?
- createdOn: DateTime?
- expiresOn: DateTime?

## allocations (Allocation)
Columns:
- id: String; primary key; default cuid()
- serverId: String; references Server.id
- artifactId: String; references Artifact.id
- username: String?
- deploymentPath: String?
- storageAllocation: String?
- port: Int?
- allocatedStorage: Int?
- allocatedOn: DateTime?
- status: String; default "active"
Indexes:
- index (artifactId, serverId)

## serverLogs (ServerLog)
Columns:
- id: String; primary key; default cuid()
- serverId: String; references Server.id
- commandId: String?
- commandName: String?
- command: String
- output: String
- status: String
- initiatedBy: String
- initiatedAt: DateTime?
- completedAt: DateTime?
Indexes:
- index (serverId, initiatedAt)

## serverCommands (ServerCommand)
Columns:
- id: String; primary key; default cuid()
- name: String
- description: String?
- commandTemplate: String
- parameters: Json?
- preExecutionScript: String?
- allocatesPort: Boolean; default false
- portToReserve: String?
- type: String; default "view"
- danger: String; default "low"
- nextCommands: Json?
- createdAt: DateTime?

## codeFiles (CodeFile)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- fileName: String
- filePath: String
- content: String
- size: Int; default 0
- createdAt: DateTime?
Indexes:
- index (artifactId, createdAt)

## linked_accounts (LinkedAccount)
Columns:
- id: String; primary key; default cuid()
- account_id: String
- platform: String
- accessToken: String
- refreshToken: String?
- scope: String
- providerUserId: String
- providerUsername: String
- authorized_on: DateTime?
Indexes:
- index (account_id, platform)
- unique (account_id, platform, providerUserId)

## api_tokens (ApiToken)
Columns:
- id: String; primary key; default cuid()
- accountId: String
- name: String
- tokenHash: String
- tokenPrefix: String
- createdAt: DateTime?
- lastUsed: DateTime?
Indexes:
- index (accountId, createdAt)

## teams (Team)
Columns:
- id: String; primary key; default cuid()
- name: String
- description: String?
- order: Int?

## members (Member)
Columns:
- id: String; primary key; default cuid()
- name: String
- email: String
- role: String
- imageUrl: String?
- permissions: Json?

## hiring (JobPosting)
Columns:
- id: String; primary key; default cuid()
- title: String
- location: String?
- type: String?
- description: String?
- status: String
- qualifications: Json?
- salary: String?
- openings: Int?
- createdAt: DateTime?
- updatedAt: DateTime?

## applicants (Applicant)
Columns:
- id: String; primary key; default cuid()
- jobId: String; references JobPosting.id
- name: String
- email: String
- resumeUrl: String?
- coverLetter: String?
- status: String
- appliedAt: DateTime?
Indexes:
- index (jobId, appliedAt)

## errors (ErrorLog)
Columns:
- id: String; primary key; default cuid()
- message: String
- stack: String?
- componentStack: String?
- source: String?
- details: String?
- timestamp: DateTime; default now()
Indexes:
- index (timestamp)

## appBaseBackups (AppBaseBackup)
Columns:
- id: String; primary key; default cuid()
- artifactId: String; references Artifact.id
- fileName: String
- fileType: String
- content: String
- backedUpAt: DateTime?
- backedUpBy: String
Indexes:
- index (artifactId, backedUpAt)

## news (NewsArticle)
Columns:
- id: String; primary key
- slug: String?
- title: String
- content: String
- author: String
- imageUrl: String?
- publishedAt: DateTime?
- createdAt: DateTime?
- updatedAt: DateTime?

## syncer_log (SyncerLog)
Columns:
- id: String; primary key; default cuid()
- appId: String? (db: app_id)
- clientId: String? (db: client_id)
- type: String
- content: String
- createdOn: DateTime? (db: created_on)
- status: String?
Indexes:
- index (appId, clientId, type, createdOn)
