# Command Flow Quick Reference

## Common Command Flows

### 1. Build & Restart (Default)
**Trigger**: `build-app`
**Flow**: Build App → Restart App

```bash
# Automatically rebuilds and restarts your application
build-app
  ├─ Cleans old build
  ├─ Installs dependencies
  ├─ Builds application
  └─ → restart-app
      ├─ Restarts PM2 process
      └─ Saves PM2 state
```

### 2. Full Deployment
**Trigger**: Create custom command
**Flow**: Pull Code → Install → Build → Restart

```typescript
// Command 1: git-pull
{
  id: 'git-pull',
  commandTemplate: 'cd {{universal.server_appPath}} && git pull origin main',
  nextCommands: ['install-packages']
}

// Command 2: install-packages (already exists)
{
  id: 'install-packages',
  nextCommands: ['build-app']
}

// Command 3: build-app (already exists)
{
  id: 'build-app',
  nextCommands: ['restart-app']
}

// Command 4: restart-app (already exists)
{
  id: 'restart-app',
  nextCommands: []
}
```

### 3. Quick Restart Only
**Trigger**: `restart-app`
**Flow**: Restart App (no chaining)

```bash
# Just restarts the PM2 process
restart-app
  ├─ Restarts PM2 process
  └─ Saves PM2 state
```

## Creating a New Flow

### Example: Database Migration Flow

```typescript
// Step 1: Create backup command
await createServerCommand({
  id: 'backup-database',
  name: 'Backup Database',
  commandTemplate: 'pg_dump mydb > /backups/$(date +%Y%m%d_%H%M%S).sql',
  nextCommands: ['run-migrations'],
  type: 'updation',
  danger: 'mid'
});

// Step 2: Create migration command
await createServerCommand({
  id: 'run-migrations',
  name: 'Run Migrations',
  commandTemplate: 'cd {{universal.server_appPath}} && npm run migrate',
  nextCommands: ['restart-app'],
  type: 'updation',
  danger: 'high'
});

// Step 3: restart-app already exists with no next commands
```

**Usage**: Run `backup-database` → automatically runs migrations → automatically restarts app

## Flow Patterns

### Linear Flow (Sequential)
```
A → B → C → D
```
Each command triggers exactly one next command.

### Branching Flow (Multiple Next Commands)
```
A → B
  → C
  → D
```
One command triggers multiple commands in sequence.

### Multi-Stage Flow
```
Stage 1: Preparation
  prepare-env → install-deps

Stage 2: Build
  build-app → run-tests

Stage 3: Deploy
  restart-app → health-check
```

## Modifying Existing Commands

### Add Flow to Existing Command

```typescript
await updateServerCommand('install-packages', {
  nextCommands: ['build-app']
});
```

### Remove Flow from Command

```typescript
await updateServerCommand('build-app', {
  nextCommands: []
});
```

## Monitoring Flows

### Check Flow Execution in Logs

Look for these markers in command output:
```
--- EXECUTING COMMAND FLOW ---
Triggering next command: [Command Name]...
✓ [Command Name] completed successfully.
--- COMMAND FLOW COMPLETE ---
```

### Check Flow Results in Code

```typescript
const result = await runCommand(serverId, 'build-app');

if (result.success) {
  console.log('Primary command succeeded');
  
  if (result.nextCommandResults) {
    result.nextCommandResults.forEach(next => {
      console.log(`${next.commandId}: ${next.success ? '✓' : '✗'}`);
    });
  }
}
```

## Tips & Tricks

### 1. Test Individual Commands First
Before creating a flow, ensure each command works independently.

### 2. Use Descriptive Command Names
Makes it easier to understand the flow in logs.

### 3. Keep Flows Short
3-4 commands maximum for maintainability.

### 4. Document Your Flows
Add clear descriptions to each command explaining its role in the flow.

### 5. Handle Failures Gracefully
Even if one command in the flow fails, others will still execute.

## Example Flows for Common Tasks

### Hot Fix Deployment
```
git-pull → build-app → restart-app
```

### Full Server Setup
```
install-requisites → clone-repo → install-packages → build-app → start-app-and-configure-proxy
```

### Routine Maintenance
```
backup-database → clean-logs → restart-app
```

### Performance Optimization
```
clear-cache → optimize-images → restart-app
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Flow not triggering | Check that primary command status is 'completed' |
| Wrong command order | Verify nextCommands array order |
| Command not found | Ensure all command IDs in nextCommands exist |
| Infinite loop | Check for circular dependencies (A→B→A) |

## Quick Command Reference

| Command ID | Purpose | Default Next Commands |
|------------|---------|----------------------|
| `install-requisites` | Install Node.js & npm | None |
| `install-packages` | Run npm install | None |
| `build-app` | Clean build application | `['restart-app']` |
| `restart-app` | Restart PM2 process | None |
| `start-app-and-configure-proxy` | Start app & setup Nginx | None |
