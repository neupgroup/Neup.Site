# Dev Rules

- Never run the dev server or any long-running process directly via executeBash. Always instruct the user to run it in their terminal.
- When the dev server needs to be started, tell the user to run `npm run dev` in their terminal.
- To kill a port, use `lsof -ti :<port> | xargs kill -9` via executeBash (this is a one-shot command, not a long-running process).
