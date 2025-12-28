# Command Flow System

## Overview

The Command Flow system enables automatic chaining of commands, where one command can trigger subsequent commands upon successful completion. This creates seamless automation workflows without manual intervention.

## How It Works

### Schema Addition

Each command now supports a `nextCommands` field - an array of command IDs that should be executed automatically after the current command completes successfully.

```typescript
{
  id: 'build-app',
  name: 'Build App',
  nextCommands: ['restart-app'], // These commands run automatically after build succeeds
  // ... other fields
}
```

### Execution Flow

1. **Primary Command Execution**: The initial command runs normally
2. **Success Check**: If the command completes with status `'completed'`
3. **Flow Trigger**: The runner checks for `nextCommands` array
4. **Sequential Execution**: Each command in `nextCommands` is executed in order
5. **Result Tracking**: Results of all chained commands are tracked and logged

### Example Workflow

```
User triggers: build-app
  ↓
  Executes: Clean build process
  ↓
  Status: completed ✓
  ↓
  Auto-triggers: restart-app (from nextCommands)
  ↓
  Executes: PM2 restart
  ↓
  Status: completed ✓
  ↓
  Workflow complete!
```

## Built-in Command Flows

### Build → Restart Flow

**Command**: `build-app`
**Next Commands**: `['restart-app']`

When you build the application, it automatically restarts the PM2 process to apply the changes.

```javascript
{
  id: 'build-app',
  nextCommands: ['restart-app']
}
```

## Creating Custom Command Flows

### 1. Define the Flow in Command Data

When creating or updating a command, add the `nextCommands` array:

```typescript
await createServerCommand({
  name: "Deploy Frontend",
  commandTemplate: "cd /app && git pull && npm install && npm run build",
  nextCommands: ['restart-app', 'clear-cache'], // Multiple commands can be chained
  type: 'updation',
  danger: 'mid'
});
```

### 2. Multiple Command Chains

You can create complex workflows:

```typescript
// Step 1: Pull latest code
{
  id: 'git-pull',
  nextCommands: ['install-deps']
}

// Step 2: Install dependencies
{
  id: 'install-deps',
  nextCommands: ['build-app']
}

// Step 3: Build application
{
  id: 'build-app',
  nextCommands: ['restart-app']
}

// Step 4: Restart app (no next commands - end of flow)
{
  id: 'restart-app',
  nextCommands: []
}
```

### 3. Parallel vs Sequential

Currently, commands in `nextCommands` execute **sequentially** - one after another. Each command waits for the previous one to complete before starting.

## Command Flow Output

The command log shows the entire flow execution:

```bash
--- EXECUTING COMMAND: Build App ---
Cleaning old build...
Installing dependencies...
Building application...
--- COMMAND FINISHED ---

--- EXECUTING COMMAND FLOW ---

Triggering next command: Restart App...
✓ Restart App completed successfully.
--- COMMAND FLOW COMPLETE ---
```

## API Response

The `runCommand` function returns additional information about chained commands:

```typescript
{
  success: true,
  logId: "abc123",
  finalStatus: "completed",
  nextCommandResults: [
    {
      commandId: "restart-app",
      success: true,
      logId: "def456"
    }
  ]
}
```

## Best Practices

### 1. Keep Flows Simple
- Avoid creating circular dependencies (A → B → A)
- Limit chain depth to 3-4 commands maximum
- Each command should have a single, clear purpose

### 2. Error Handling
- If a command in the flow fails, subsequent commands still execute
- Check the `nextCommandResults` array to see which commands succeeded
- The original command's log includes all flow execution details

### 3. Common Flow Patterns

**Build & Deploy Flow**:
```
clean-build → run-tests → restart-app → clear-cache
```

**Database Migration Flow**:
```
backup-db → run-migrations → restart-app
```

**Full Deployment Flow**:
```
git-pull → install-deps → build-app → restart-app → health-check
```

### 4. Testing Flows
- Test each command individually first
- Then test the complete flow
- Monitor the logs to ensure proper execution order

## Disabling Command Flow

To disable automatic command chaining for a specific command, simply:
- Set `nextCommands: []` (empty array)
- Or omit the `nextCommands` field entirely

## Use Cases

1. **Continuous Deployment**: Automatically restart after building
2. **Database Operations**: Chain backup → migrate → restart
3. **Cache Management**: Clear cache after deployment
4. **Health Checks**: Run diagnostics after major changes
5. **Multi-step Setups**: Chain installation and configuration commands

## Troubleshooting

### Flow Not Executing
- Check that the primary command completed with status `'completed'`
- Verify `nextCommands` array contains valid command IDs
- Check server logs for any errors

### Partial Flow Execution
- Review `nextCommandResults` in the response
- Check individual command logs for failure reasons
- Ensure all command IDs in `nextCommands` exist

### Performance Issues
- Reduce the number of commands in the chain
- Consider combining related operations into a single command
- Use command flows only for critical automation paths

## Future Enhancements

Potential improvements to the command flow system:

1. **Conditional Flows**: Execute different commands based on conditions
2. **Parallel Execution**: Run multiple commands simultaneously
3. **Flow Templates**: Pre-defined workflow templates
4. **Flow Visualization**: UI to visualize command chains
5. **Rollback Flows**: Automatic rollback on failure
6. **Flow Scheduling**: Time-based flow execution

## Related Documentation

- [Server Command Execution](./server-command-execution.md)
- [Command Schema](../src/schemas/command.ts)
- [Runner Implementation](../src/actions/runner.ts)
