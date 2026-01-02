# Bridge Folder Reorganization

## Summary
All webhooks, APIs, and callback managing pages have been moved to a top-level `bridge` folder. The bridge folder is now **completely isolated** from all route groups and is not inside `(editor)`, `(manage)`, `(onboard)`, `(preview)`, or `(public)`.

## Changes Made

### Before
```
src/app/
├── (editor)/
│   ├── editor/
│   └── bridge/              ❌ Bridge was inside (editor)
│       └── callback/
│           └── v1/
│               └── accounts/
│                   └── linked/
│                       └── github/
│                           └── route.ts
├── api/                     ❌ API routes were separate
│   └── v1/
│       ├── github/
│       │   └── start/
│       │       └── route.ts
│       └── ping/
│           └── route.ts
└── auth/
    └── page.tsx
```

### After
```
src/app/
├── (editor)/
│   └── editor/              ✅ Bridge removed from (editor)
├── (manage)/
├── (onboard)/
├── (preview)/
├── (public)/
├── bridge/                  ✅ Bridge is now at top level
│   ├── api/                 ✅ All APIs inside bridge
│   │   └── v1/
│   │       ├── github/
│   │       │   └── start/
│   │       │       └── route.ts
│   │       └── ping/
│   │           └── route.ts
│   └── callback/            ✅ All callbacks inside bridge
│       └── v1/
│           └── accounts/
│               └── linked/
│                   └── github/
│                       └── route.ts
└── auth/
    └── page.tsx
```

## Route Mappings

| Purpose | Old Path | New Path | URL |
|---------|----------|----------|-----|
| GitHub OAuth Start | `/api/v1/github/start` | `/bridge/api/v1/github/start` | `/bridge/api/v1/github/start` |
| Ping API | `/api/v1/ping` | `/bridge/api/v1/ping` | `/bridge/api/v1/ping` |
| GitHub Callback | `/(editor)/bridge/callback/v1/accounts/linked/github` | `/bridge/callback/v1/accounts/linked/github` | `/bridge/callback/v1/accounts/linked/github` |

## Benefits

1. **Clear Separation**: All external integrations (webhooks, APIs, callbacks) are now in one place
2. **Not in Route Groups**: Bridge is isolated from UI route groups, preventing confusion
3. **Scalability**: Easy to add more integrations (Facebook, Instagram, LinkedIn, etc.) under the same structure
4. **Consistency**: All bridge-related routes follow the same pattern: `/bridge/{type}/v1/...`

## Future Integration Pattern

When adding new integrations, follow this pattern:

```
src/app/bridge/
├── api/
│   └── v1/
│       ├── github/
│       ├── facebook/        ← Add new OAuth starts here
│       ├── instagram/
│       └── linkedin/
└── callback/
    └── v1/
        └── accounts/
            └── linked/
                ├── github/
                ├── facebook/  ← Add new callbacks here
                ├── instagram/
                └── linkedin/
```

## Important Notes

- ✅ Bridge folder is **NOT** inside any route group
- ✅ Bridge folder contains **ALL** webhooks, APIs, and callbacks
- ✅ Route groups `(editor)`, `(manage)`, `(onboard)`, `(preview)`, and `(public)` do **NOT** contain bridge
- ✅ URLs will change from `/api/v1/*` to `/bridge/api/v1/*`
- ⚠️ **Action Required**: Update any hardcoded URLs or environment variables that reference the old API paths

## Files Moved

1. `src/app/api/v1/github/start/route.ts` → `src/app/bridge/api/v1/github/start/route.ts`
2. `src/app/api/v1/ping/route.ts` → `src/app/bridge/api/v1/ping/route.ts`
3. `src/app/(editor)/bridge/callback/v1/accounts/linked/github/route.ts` → `src/app/bridge/callback/v1/accounts/linked/github/route.ts`

## Directories Removed

1. `src/app/api/` - Deleted (moved to bridge)
2. `src/app/(editor)/bridge/` - Deleted (moved to top level)

## Next Steps

1. ✅ **Completed**: Reorganize folder structure
2. ✅ **Completed**: Update ROUTE_STRUCTURE.md documentation
3. ⚠️ **TODO**: Update any code that references `/api/v1/*` to use `/bridge/api/v1/*`
4. ⚠️ **TODO**: Update environment variables (GITHUB_REDIRECT_URI, etc.) to point to new callback URLs
5. ⚠️ **TODO**: Update OAuth app settings in GitHub to use new callback URL
6. ⚠️ **TODO**: Test all OAuth flows to ensure they work with new URLs
