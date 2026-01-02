# Bridge Folder Organization - Visual Guide

## 📁 Complete Directory Structure

```
/Users/neupkishor/Documents/neupsites/
└── src/
    └── app/
        ├── (editor)/                    🎨 Editor Route Group
        │   └── editor/
        │       ├── layout.tsx
        │       └── page.tsx
        │
        ├── (manage)/                    📊 Management Route Group
        │   ├── analytics/
        │   ├── settings/
        │   │   └── accounts/
        │   │       └── github/
        │   │           └── page.tsx     ✅ Updated to use /bridge/api/v1/github/start
        │   ├── status/
        │   │   └── page.tsx             ✅ Updated to use /bridge/api/v1/ping
        │   └── ...
        │
        ├── (onboard)/                   🚀 Onboarding Route Group
        │   └── onboarding/
        │
        ├── (preview)/                   👁️ Preview Route Group
        │   └── preview/
        │
        ├── (public)/                    🌐 Public Route Group
        │   └── [...slug]/
        │
        ├── bridge/                      🌉 BRIDGE FOLDER (Top Level)
        │   ├── api/                     📡 All API Endpoints
        │   │   └── v1/
        │   │       ├── github/
        │   │       │   └── start/
        │   │       │       └── route.ts  → /bridge/api/v1/github/start
        │   │       └── ping/
        │   │           └── route.ts      → /bridge/api/v1/ping
        │   │
        │   └── callback/                🔄 All OAuth Callbacks
        │       └── v1/
        │           └── accounts/
        │               └── linked/
        │                   └── github/
        │                       └── route.ts → /bridge/callback/v1/accounts/linked/github
        │
        ├── auth/                        🔐 Authentication
        │   └── page.tsx
        │
        ├── layout.tsx
        ├── globals.css
        └── ...
```

## 🎯 Key Principles

### ✅ DO's
- ✅ All webhooks go in `/bridge/callback/`
- ✅ All APIs go in `/bridge/api/`
- ✅ Bridge stays at top level (not in any route group)
- ✅ Use versioning: `/bridge/api/v1/`, `/bridge/callback/v1/`
- ✅ Organize by platform: `/bridge/callback/v1/accounts/linked/{platform}/`

### ❌ DON'Ts
- ❌ Don't put bridge inside `(editor)`
- ❌ Don't put bridge inside `(manage)`
- ❌ Don't put bridge inside `(onboard)`
- ❌ Don't put bridge inside `(preview)`
- ❌ Don't put bridge inside `(public)`
- ❌ Don't create separate `/api` folder at root level

## 🔗 URL Routing

### Route Groups (Invisible in URLs)
Route groups use parentheses and don't affect URLs:

| File Path | Actual URL |
|-----------|------------|
| `(manage)/analytics/page.tsx` | `/analytics` |
| `(editor)/editor/page.tsx` | `/editor` |
| `(public)/[...slug]/page.tsx` | `/any/path` |

### Bridge Routes (Visible in URLs)
Bridge routes are NOT in a route group, so they appear in URLs:

| File Path | Actual URL |
|-----------|------------|
| `bridge/api/v1/ping/route.ts` | `/bridge/api/v1/ping` |
| `bridge/api/v1/github/start/route.ts` | `/bridge/api/v1/github/start` |
| `bridge/callback/v1/accounts/linked/github/route.ts` | `/bridge/callback/v1/accounts/linked/github` |

## 🚀 Adding New Integrations

### Example: Adding Facebook OAuth

1. **Create OAuth Start Endpoint**
   ```
   src/app/bridge/api/v1/facebook/start/route.ts
   ```
   URL: `/bridge/api/v1/facebook/start`

2. **Create OAuth Callback**
   ```
   src/app/bridge/callback/v1/accounts/linked/facebook/route.ts
   ```
   URL: `/bridge/callback/v1/accounts/linked/facebook`

3. **Update UI to Link**
   ```tsx
   // In your settings page
   <Link href="/bridge/api/v1/facebook/start">
     Connect Facebook
   </Link>
   ```

### Example: Adding a Webhook

1. **Create Webhook Endpoint**
   ```
   src/app/bridge/webhook/v1/stripe/payment-success/route.ts
   ```
   URL: `/bridge/webhook/v1/stripe/payment-success`

2. **Configure in External Service**
   ```
   Webhook URL: https://yourdomain.com/bridge/webhook/v1/stripe/payment-success
   ```

## 📊 Migration Summary

### What Changed
- ❌ Removed: `/src/app/api/`
- ❌ Removed: `/src/app/(editor)/bridge/`
- ✅ Added: `/src/app/bridge/`

### What Stayed the Same
- ✅ All route groups: `(editor)`, `(manage)`, `(onboard)`, `(preview)`, `(public)`
- ✅ Auth folder: `/src/app/auth/`
- ✅ All other pages and components

## 🎨 Visual Separation

```
┌─────────────────────────────────────────────────────────┐
│                    src/app/                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 Route Groups (UI Pages)                            │
│  ├── (editor)    → Editor interface                    │
│  ├── (manage)    → Dashboard & settings                │
│  ├── (onboard)   → Onboarding flow                     │
│  ├── (preview)   → Preview pages                       │
│  └── (public)    → Public-facing pages                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌉 Bridge (External Integrations)                     │
│  └── bridge/                                           │
│      ├── api/        → API endpoints                   │
│      ├── callback/   → OAuth callbacks                 │
│      └── webhook/    → Webhooks (future)               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔐 Other                                              │
│  └── auth/       → Authentication pages                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## ✅ Verification Commands

```bash
# Check bridge is at top level
ls -la src/app/ | grep bridge

# Verify bridge is NOT in route groups
find src/app -type d -name "bridge" | grep -E '\(editor\)|\(manage\)|\(onboard\)|\(preview\)|\(public\)'
# Should return nothing (exit code 1)

# List all bridge routes
find src/app/bridge -type f -name "*.ts" | sort

# Check (editor) doesn't have bridge
ls -la src/app/\(editor\)/
# Should only show 'editor' folder
```

## 🎉 Benefits

1. **Clear Separation**: UI pages vs external integrations
2. **Scalability**: Easy to add new platforms (Facebook, Instagram, LinkedIn, etc.)
3. **Maintainability**: All integrations in one place
4. **Consistency**: Predictable URL structure for all external services
5. **Organization**: No confusion about where to put webhooks/APIs/callbacks
