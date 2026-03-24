# Console Chat — Bio-Research Assistant

Console chat prototype using the [GitHub Copilot SDK](https://github.com/github/copilot-sdk).
Bio-research assistant connected to MCP servers for protein databases, structure prediction, and more.

## Prerequisites

- Python 3.11+
- Node.js 18+ (for PDB and AlphaFold MCP servers)
- [uv](https://docs.astral.sh/uv/) package manager
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) installed and authenticated (`copilot` in PATH)
- A GitHub Copilot subscription

## Setup

```bash
cd console-chat
uv sync                            # Python deps (Copilot SDK, UniProt MCP)
uv run python setup_mcp_servers.py # Clone & build PDB + AlphaFold servers
```

## Run

```bash
uv run python main.py
```

Type messages and press Enter. Type `quit` or `exit` to stop.

## MCP Servers

| Server | Source | What it provides |
|--------|--------|-----------------|
| **UniProt** | [uniprot-mcp](https://pypi.org/project/uniprot-mcp/) (Python) | Protein entries, sequences, search, ID mapping |
| **PDB** | [Augmented-Nature/PDB-MCP-Server](https://github.com/Augmented-Nature/PDB-MCP-Server) (Node.js) | RCSB Protein Data Bank — 3D structures, quality metrics |
| **AlphaFold** | [Augmented-Nature/AlphaFold-MCP-Server](https://github.com/Augmented-Nature/AlphaFold-MCP-Server) (Node.js) | Predicted structures, confidence scores, batch analysis |