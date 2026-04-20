# OncoQuery Backend — Bio-Research Assistant API

FastAPI backend using the [GitHub Copilot SDK](https://github.com/github/copilot-sdk).
Bio-research assistant connected to MCP servers for protein databases, structure prediction, and more.

## Prerequisites

- Python 3.11+
- Node.js 18+ (for PDB and AlphaFold MCP servers)
- [uv](https://docs.astral.sh/uv/) package manager
- A GitHub Copilot subscription with a fine-grained PAT (`github_pat_...`) having the **Copilot Requests** permission

## Setup

```bash
cd ./g3/backend
uv sync                             # Install Python deps (Copilot SDK, UniProt MCP)
uv pip install github-copilot-sdk
uv run python -m mcp.pdb_alpha_mcp  # Clone & build PDB + AlphaFold Node.js servers, if mcp-servers already exists -- skip this command
```

## Authentication

The backend requires a GitHub fine-grained Personal Access Token with the **Copilot Requests** permission.
Generate one at: **github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens**

> Generate a new token with the "Copilot Requests" permission (under "Other permissions")
> ⚠️ Classic `ghp_` tokens are NOT supported.

Set it as an environment variable before running:

```powershell
# PowerShell
$env:COPILOT_GITHUB_TOKEN = "github_pat_..."
uv run python api.py
```

```bash
# bash / Linux / macOS
COPILOT_GITHUB_TOKEN="github_pat_..." uv run python api.py
```

## Run

```bash
uv run python api.py
```

Server runs on http://127.0.0.1:8080

Interactive API docs: http://127.0.0.1:8080/docs

## Testing

Install test dependencies:
```bash
pip install -e ".[test]"
```

Run unit tests:
```bash
pytest tests/ -v
```

Run tests with coverage report (HTML output):
```bash
pytest tests/ -v --cov=. --cov-report=html:coverage_report --cov-report=term
```

View the HTML coverage report in `backend/coverage_report/index.html`

Tests are automatically run on every push/pull request via GitLab CI (see `.gitlab-ci.yml`).

## MCP Servers

| Server | Source | What it provides |
|--------|--------|-----------------|
| **UniProt** | [uniprot-mcp](https://pypi.org/project/uniprot-mcp/) (Python) | Protein entries, sequences, search, ID mapping |
| **PDB** | [Augmented-Nature/PDB-MCP-Server](https://github.com/Augmented-Nature/PDB-MCP-Server) (Node.js) | RCSB Protein Data Bank — 3D structures, quality metrics |
| **AlphaFold** | [Augmented-Nature/AlphaFold-MCP-Server](https://github.com/Augmented-Nature/AlphaFold-MCP-Server) (Node.js) | Predicted structures, confidence scores, batch analysis |