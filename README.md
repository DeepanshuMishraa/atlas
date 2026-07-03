# Atlas

A terminal-native AI assistant with persistent memory. Atlas lives in your terminal, knows your projects, and remembers context across sessions.

## How it works

Atlas runs as a TUI chat interface powered by OpenTUI. When you ask something, it:

- **Searches its memory** for relevant context — past conversations, project details, things you've told it before.
- **Runs shell commands** in a sandboxed environment to explore your codebase, run scripts, or manipulate files.
- **Searches the web** when it needs external information.
- **Saves what it learns** — new facts, preferences, command history — so it sticks across sessions.

Everything happens in your terminal. No browser, no Electron, no daemon.

## Getting started

```sh
bun install
```

Start the backend:

```sh
cd backend
bun run dev
```

In another shell, start the TUI:

```sh
bun run dev
```
