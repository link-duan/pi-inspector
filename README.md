# pi-inspector

Inspect the current pi session in your browser: live system prompt, full transcript with every internal field, commands, and tools.

## Install

```bash
pi install npm:pi-inspector        # or: pi install ./path/to/pi-inspector
```

## Usage

- `/inspect` — start the local dashboard and open your browser
- `/inspect stop` — stop the dashboard
- `/inspect status` — show the current URL
- `/inspect open` — reopen the browser tab

The listen URL is also shown in the pi footer status bar.

## Features

- **Left column**: session metadata, system prompt (copyable, from `before_agent_start` — the fully-assembled per-turn prompt), slash commands, and tool definitions
- **Right column**: transcript rendered as a tree (roles color-coded, active branch highlighted); click any entry to view its complete raw JSON (all internal fields) with `highlight.js` syntax highlighting
- **Resizable panels**: drag the divider between the left/right columns and between the tree and detail panes (positions are remembered in `localStorage`)
- **Live updates**: pi events (`message_*`, `turn_*`, `tool_execution_*`, `agent_*`, `session_*`, `model_select`, …) are coalesced and pushed to the browser over SSE — no polling
- Server binds `127.0.0.1` with an ephemeral port; nothing is written to disk

## Development

```bash
bun install      # install dev dependencies
bunx tsc --noEmit  # type check
pi -e ./src/index.ts  # run the extension directly
```
