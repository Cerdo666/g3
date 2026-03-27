# OncoQuery — Bio-Research AI Assistant

AI-powered bio-research assistant that connects a React frontend to a FastAPI backend, using GitHub Copilot as the reasoning engine and multiple MCP servers for live data from UniProt, PDB, and AlphaFold.

---

## Project Structure

```
g3/
├── backend/          # FastAPI server — Copilot SDK + MCP orchestration
├── frontend/         # React + Vite + Tailwind UI
├── console-test/     # Early proof-of-concept (terminal chat, no UI)
├── Documentation/    # Mockups and database schema
└── README.md         # This file
```

### `backend/`
Python FastAPI server that:
- Manages a persistent GitHub Copilot session via the [Copilot SDK](https://github.com/github/copilot-sdk)
- Connects to three MCP servers (UniProt, PDB, AlphaFold) and routes tool calls through them
- Streams responses back to the frontend as Server-Sent Events (SSE)

Key files:
```
backend/
├── api.py                  # FastAPI app, /chat and /status endpoints
├── mcp/
│   ├── servers.py          # MCP server config builder
│   ├── hooks.py            # Pre/post tool-use hooks, tool event queue
│   ├── pdb_alpha_mcp.py    # Clones & builds PDB + AlphaFold Node.js servers
│   └── uniprot_mcp_wrapper.py
├── mcp-servers/            # Auto-cloned Node.js MCP servers (git-ignored)
└── streaming/
    └── models.py           # SSEEvent helpers (content, tool_call, done)
```

→ See [backend/README.md](./backend/README.md) for setup and authentication instructions.

---

### `frontend/`
React + Vite + Tailwind CSS interface that:
- Streams chat responses from the backend in real time
- Shows MCP tool invocations live as the agent works
- Displays builtin tools and MCP tools separately

Key files:
```
frontend/src/
├── app/
│   ├── App.tsx             # Chat state, SSE stream handler, message list
│   └── components/
│       ├── ChatMessage.tsx # Message renderer with Markdown + tool badges
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── ...             # Auth modals, history, projects, etc.
└── main.tsx
```

→ See [frontend/README.md](./frontend/README.md) for setup instructions.

---

### `console-test/`
First proof-of-concept: a terminal-only chat client (no web UI) used to verify that multiple MCP servers (UniProt, PDB, AlphaFold) could be wired to a single Copilot agent and respond correctly. Not intended for production use.

→ See [console-test/README.md](./console-test/README.md) for details.

---

### `Documentation/`
Design and data assets:
```
Documentation/
├── mockups/            # UI mockups
├── mongoDB_schema.png  # Database schema diagram
└── schema.json         # MongoDB schema definition
```

---

## Running the Full Application

**1. Start the backend** (from `g3/backend/`):
```powershell
$env:COPILOT_GITHUB_TOKEN = "github_pat_..."
uv run python api.py
```
Backend runs on http://127.0.0.1:8080

**2. Start the frontend** (from `g3/frontend/`):
```bash
npm run dev
```
Frontend runs on http://localhost:5173

Both must be running simultaneously for the chat to work.
