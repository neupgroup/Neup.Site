# Neup Ecosystem Engineering Rules

This document defines the complete architecture, naming, permission, and design standards for the Neup ecosystem.

---

# 1. Location Rules (Architecture & Folder Structure)

## 1.1 Core Principle
- If it touches DATA → `/services`
- If it touches UI → `/components`
- If it connects everything → `/app`
- If it exposes external interface (API/gRPC/Webhooks) → `/app/bridge` or `/grpc`

---

## 1.2 Services Layer (`/services`)

### Purpose
Central business logic and data handling layer.

### Place code here if:
- It communicates with API / database
- It processes or transforms data
- It contains business logic
- It is reusable across the system

### Rules:
- No UI logic
- No framework-specific hooks (React, etc.)
- Must be reusable across:
  - UI components
  - API routes
  - gRPC handlers

---

## 1.3 Components Layer (`/components`)

### Purpose
UI rendering and local interaction logic.

### Place code here if:
- It is UI-specific
- It is used only within a component
- It handles local UI state

### Rules:
- No direct API calls
- No heavy business logic
- Can contain small UI logic (e.g., toggle like button)

---

## 1.4 App Layer (`/app`)

### Purpose
Composition and orchestration layer.

### Responsibilities:
- Page routing
- Layout structure
- Connecting services to UI

### Rules:
- No reusable business logic
- No heavy processing
- Only orchestration

---

## 1.5 API / Webhooks / Callbacks Layer (`/app/bridge/api.v1/...`)

### Purpose
External interface for:
- REST APIs
- Webhooks
- Callbacks

### Structure:
/app/bridge/api.v1/<domain>/<subdomain>/...


### Rules:
- MUST NOT contain business logic
- MUST call `/services` for all operations
- Acts only as a bridge between external requests and internal services

### Example Flow:
API Route → Service → Database


---

## 1.6 gRPC Layer (`/grpc`)

### Purpose
Define and expose gRPC protocols and handlers.

### Structure:
/grpc/protos
/grpc/handlers


### Rules:
- Protocol definitions stored in `/grpc`
- Handlers must call `/services`
- No business logic duplication

### Key Principle:
gRPC and REST APIs share the SAME services layer.

---

## 1.7 Shared Logic Rule

All of the following MUST use the same `/services`:
- UI Pages
- REST APIs
- Webhooks
- gRPC services

> No duplication of business logic across layers.

---

## 1.8 Decision Checklist

1. Does it talk to backend/data?
   → `/services`

2. Is it UI-only?
   → `/components`

3. Is it routing/composition?
   → `/app`

4. Is it external interface?
   → `/app/bridge` or `/grpc`

---

## 1.9 Golden Rule
Business logic must exist ONLY in `/services`.

---

# 2. Naming Rules

## 2.1 General Rules
- Use clear, descriptive names
- Avoid unnecessary abbreviations
- Maintain consistency

---

## 2.2 File Naming

### Components
- PascalCase

Examples:
- UserCard.jsx
- PropertyItem.jsx

---

### Services
- camelCase + Service

Examples:
- userService.js
- propertyService.js

---

### API / Bridge Files
- kebab-case or camelCase (consistent per project)

Examples:
- create-user.js
- webhook-handler.js

---

### gRPC Files
- snake_case for proto files
- camelCase for handlers

Examples:
- user_service.proto
- userHandler.js

---

## 2.3 Function Naming

### General
- camelCase
- Verb-based

Examples:
- getUser()
- createPost()
- updateListing()

---

### Boolean Functions
- Prefix with:
  - is
  - has
  - can

Examples:
- isAuthorized()
- hasAccess()
- canEdit()

---

### Event Handlers
- Prefix with `handle`

Examples:
- handleClick()
- handleSubmit()

---

## 2.4 Variable Naming

- camelCase

Examples:
- userData
- postList
- isLoading

---

## 2.5 Constants

- UPPER_SNAKE_CASE

Examples:
- API_URL
- MAX_LIMIT

---

## 2.6 Golden Rule
If a name needs explanation, rename it.

---

# 3. Permission Rules (Neup Ecosystem)

## 3.1 Core Principle
- Secure by default
- Role-based
- Backend enforced

---

## 3.2 Roles

### Super Admin
- Full system control

### Admin
- Business-level control

### Manager
- Resource-level control

### User
- Basic access

### Guest
- Read-only access

---

## 3.3 Permission Types

- READ
- WRITE
- DELETE
- MANAGE

---

## 3.4 Permission Structure

Format:
module.action


Examples:
- user.create
- property.delete
- analytics.view

---

## 3.5 Rules

### Rule 1: Least Privilege
Give minimum required access.

---

### Rule 2: RBAC
Assign permissions to roles, not users.

---

### Rule 3: Backend Validation
- Always validate in backend
- Never trust frontend

---

### Rule 4: UI Handling
- Hide restricted actions
- Disable unauthorized controls

---

### Rule 5: Ownership
- Users can only modify their own data unless elevated

---

### Rule 6: Audit Logs
Track:
- Deletes
- Updates
- Logins

---

## 3.6 Golden Rule
Authorization must always be enforced at the service or backend layer.

---

# 4. Design Rules (Neup Ecosystem)

## 4.1 Core Principle
- Clean
- Consistent
- Scalable
- User-first

---

## 4.2 Layout System

### Grid
- Use structured grid (e.g., 12-column)

---

### Spacing
- Follow 8px system

Examples:
- 8 / 16 / 24 / 32

---

## 4.3 Typography

- Maintain hierarchy

Examples:
- H1 → Page title
- H2 → Section
- Body → Content

---

## 4.4 Color System

- Define:
  - Primary
  - Secondary
  - Neutral
- Avoid random usage

---

## 4.5 Component Design

### Reusability
- Build reusable components

---

### States
Each component must support:
- Default
- Hover
- Active
- Disabled
- Loading

---

### Simplicity
- Avoid unnecessary complexity

---

## 4.6 UX Rules

### Feedback
- Always show:
  - Loading
  - Success
  - Error

---

### Accessibility
- Proper contrast
- Readable text

---

### Performance
- Optimize assets
- Avoid heavy UI

---

## 4.7 Forms

- Clear labels
- Proper validation
- Visible error messages

---

## 4.8 Buttons

- Primary → Main action
- Secondary → Secondary action
- Danger → Destructive action

---

## 4.9 Icons

- Use consistent icon system
- Do not mix styles

---

## 4.10 Responsiveness

Design for:
- Mobile
- Tablet
- Desktop

---

## 4.11 Golden Rule
If the user has to think, the design has failed.