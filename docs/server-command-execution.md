# Server Command Execution Guide

This document explains the architecture and workflow for executing commands on remote servers from the Neup.Sites dashboard.

## Core Technology

The entire process is built upon the **`node-ssh`** library, a powerful and promise-based SSH client for Node.js. This allows the application's backend to securely connect to and manage your servers using SSH keys.

## The Execution Flow

The process is designed to be secure, robust, and provide real-time feedback to the user. Here is the step-by-step flow:

1.  **Initiation from UI**:
    *   A user action in the dashboard (e.g., clicking "Run Command" or a pre-defined action button) triggers a Next.js Server Action, typically `runCommand` located in `src/actions/runner.ts`.

2.  **Initial Logging**:
    *   Before any connection is made, the `runCommand` action immediately creates a new document in the `serverLogs` collection in Firestore.
    *   This log entry is marked with a `status` of `"pending"`. This provides instant feedback in the UI that the command has been acknowledged and is about to run.

3.  **Secure Connection**:
    *   The backend retrieves the target server's connection details (IP address, username, and private key) securely from the `servers` collection in Firestore.
    *   It then uses `new NodeSSH().connect()` to establish a secure SSH connection to the remote server.

4.  **Swap File Management & Command Execution**:
    *   To prevent memory-related crashes during intensive tasks (like `npm install` or application builds), the actual command is wrapped in a shell script.
    *   This wrapper script first **creates a temporary 4GB swap file** on the remote server.
    *   It then executes the user's command.
    *   Crucially, it uses a `trap` command to **ensure the swap file is deleted** after the script finishes, even if the command fails.

5.  **Real-time Output Streaming**:
    *   The command is executed using `ssh.execCommand(command, { onStdout, onStderr })`.
    *   The `onStdout` and `onStderr` are event handlers that listen for data chunks from the server's standard output and standard error streams.
    *   As data chunks are received, they are appended to an `output` variable.
    *   This `output` variable is then used to **update the server log document in Firestore in real-time**.
    *   The frontend polls this log document, which is how the "live" terminal feed is displayed to the user.

6.  **Finalizing the Log**:
    *   Once `execCommand` completes, the backend checks the exit code.
    *   If the exit code is `0` (success), the log document's `status` is updated to `"completed"`.
    *   If the exit code is non-zero (failure), the `status` is updated to `"failed"`.
    *   The final, complete output is saved one last time, and the SSH connection is closed.

This entire process ensures that server commands are executed reliably with sufficient memory, and the user gets a seamless, real-time view of the execution progress and output, directly in the dashboard.
