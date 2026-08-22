# Route Structure Documentation

## Overview
The application is organized into two main route groups for better organization and separation of concerns.

## Route Groups

### 1. **(manage)** - `/src/app/(manage)`
**Purpose:** Dashboard and management pages

**Contains:**
- `/` - Main dashboard page
- `/advanced` - Advanced settings
- `/analytics` - Analytics dashboard
- `/appbase` - App base management
- `/article` - Article management
- `/codebase` - Codebase management
- `/estate` - Estate management
- `/manage` - General management pages
- `/news` - News management
- `/root` - Root configuration
- `/settings` - Settings pages
- `/site` - Site management
- `/status` - Status pages
- `/tourio` - Tourism management

**Layout:** Has its own `layout.tsx` for dashboard-specific UI

---

### 2. **(onboard)** - `/src/app/(onboard)`
**Purpose:** Initial site setup and onboarding flow

**Contains:**
- `/onboard` - Onboarding page for new sites

---

## Other Routes

### `/bridge` - Webhooks, APIs, and Callbacks
**Purpose:** All external integrations, webhooks, API endpoints, and OAuth callbacks

**Contains:**
- `/bridge/api/v1/github/start` - GitHub OAuth initialization
- `/bridge/api/v1/ping` - Ping API endpoint
- `/bridge/callback/v1/accounts/linked/github` - GitHub OAuth callback handler

**Key Features:**
- Isolated from route groups (not inside editor, manage, onboard, preview, or public)
- Handles all external service integrations
- Manages OAuth flows and webhooks

### `/auth` - Authentication
- Authentication-related pages for site access

---

## Key Changes Made

### Fixed Errors
1. **Updated route grouping**
   - Management, onboarding, and bridge routes are isolated into dedicated route groups.

### Migration Details
- Moved `(dashboard)` → `(manage)`
- Moved `onboarding` → `(onboard)/onboard`
- Moved `api` → `bridge/api` (all API routes now under bridge)
- Moved `(editor)/bridge/callback` → `bridge/callback` (callbacks now at top level under bridge)

---

## Route Group Benefits

1. **Better Organization:** Clear separation between management, onboarding, and integration routes
2. **Shared Layouts:** Each group can have its own layout without affecting others
3. **URL Structure:** Route groups don't affect the URL (parentheses are ignored)
4. **Easier Navigation:** Developers can quickly find related pages

---

## URL Examples

| Route Group | File Path | Actual URL |
|------------|-----------|------------|
| (manage) | `/src/app/(manage)/analytics/page.tsx` | `/analytics` |
| (onboard) | `/src/app/(onboard)/onboard/page.tsx` | `/onboard` |
| bridge | `/src/app/bridge/api/v1/ping/route.ts` | `/bridge/api/v1/ping` |
| bridge | `/src/app/bridge/callback/v1/accounts/linked/github/route.ts` | `/bridge/callback/v1/accounts/linked/github` |

---

## Notes

- Route groups (folders with parentheses) don't affect the URL structure
- Each route group can have its own `layout.tsx`
- The `bridge` folder is at the top level and contains all webhooks, APIs, and OAuth callbacks
- Bridge routes are NOT inside any route group (editor, manage, onboard, preview, or public)
