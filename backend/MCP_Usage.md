# MCP Servers — How They Work

## What is MCP?

[Model Context Protocol](https://modelcontextprotocol.io/) is an open standard
for connecting AI agents to external tools and data sources. Each MCP server is a
**separate process** that exposes a set of tools (functions) over JSON-RPC. The
agent can call these tools during a conversation just like built-in functions.

## Architecture

```
User (console)
    │
    ▼
┌──────────────┐       JSON-RPC (stdio)       ┌─────────────────┐
│  main.py     │◄────────────────────────────► │  Copilot CLI    │
│  (our app)   │       (Copilot SDK)           │  (agent engine) │
└──────────────┘                               └───────┬─────────┘
                                                       │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                     JSON-RPC (stdio)          JSON-RPC (stdio)          JSON-RPC (stdio)
                              │                         │                         │
                    ┌─────────▼──────┐        ┌─────────▼──────┐        ┌─────────▼──────┐
                    │  UniProt MCP   │        │   PDB MCP      │        │ AlphaFold MCP  │
                    │  (Python)      │        │   (Node.js)    │        │ (Node.js)      │
                    └───────┬────────┘        └───────┬────────┘        └───────┬────────┘
                            │                         │                         │
                            ▼                         ▼                         ▼
                   rest.uniprot.org           data.rcsb.org          alphafold.ebi.ac.uk
```

**Key point:** The Copilot CLI (agent engine) spawns each MCP server as a child
process and talks to it over stdin/stdout. Our app (`main.py`) never calls the
MCP servers directly — the agent decides which tools to call based on the user's
question.

---

## How MCP Servers Are Attached to the Agent

In `main.py`, the `build_mcp_servers()` function builds a config dict that gets
passed to `create_session()`:

```python
session = await client.create_session({
    "model": "gpt-4o",
    "mcp_servers": {
        "uniprot": {
            "type": "local",           # spawned as subprocess
            "command": "python",       # executable to run
            "args": ["uniprot_mcp_wrapper.py"],
            "tools": ["*"],            # expose all tools to the agent
        },
        "pdb": {
            "type": "local",
            "command": "node",
            "args": ["mcp-servers/pdb-server/build/index.js"],
            "tools": ["*"],
        },
        "alphafold": {
            "type": "local",
            "command": "node",
            "args": ["mcp-servers/alphafold-server/build/index.js"],
            "tools": ["*"],
        },
    },
})
```

When the session starts, the Copilot CLI:
1. Spawns each MCP server process
2. Discovers available tools via the MCP `tools/list` handshake
3. Registers them with tool names prefixed by the server key (e.g. `uniprot-fetch_entry`, `pdb-search_structures`)
4. The LLM sees all tools in its context and decides which to call per query

---

## The Three Servers

### 1. UniProt MCP

| | |
|---|---|
| **Source** | [uniprot-mcp](https://pypi.org/project/uniprot-mcp/) (PyPI package) |
| **Language** | Python (FastMCP) |
| **Backend API** | `https://rest.uniprot.org` |
| **Install** | `uv sync` installs it as a Python dependency |
| **Run mechanism** | We launch `uniprot_mcp_wrapper.py` instead of the bare binary — this patches a bug in v0.1.0 where httpx event hooks are sync instead of async |

**Tools:**

| Tool | Description |
|------|-------------|
| `fetch_entry` | Full protein entry by accession (P04637, etc.) — includes function, features, GO, xrefs |
| `get_sequence` | Protein amino acid sequence + metadata |
| `search_uniprot` | Full-text search with filters (organism, reviewed, keywords) |
| `map_ids` | Convert between 200+ database ID types (UniProt ↔ PDB, Ensembl, RefSeq…) |
| `fetch_entry_flatfile` | Historical entry versions in txt/fasta format |

**Bug workaround:** The file `uniprot_mcp_wrapper.py` monkey-patches
`uniprot_mcp.obs.create_httpx_event_hooks` to make the httpx hooks `async def`
before starting the server. Once upstream fixes this, we can switch back to the
`uniprot-mcp` binary directly.

---

### 2. PDB MCP (Protein Data Bank)

| | |
|---|---|
| **Source** | [Augmented-Nature/PDB-MCP-Server](https://github.com/Augmented-Nature/PDB-MCP-Server) |
| **Language** | TypeScript / Node.js |
| **Backend API** | RCSB PDB — `data.rcsb.org`, `search.rcsb.org`, `files.rcsb.org` |
| **Install** | `git clone` + `npm install` + `npm run build` (automated by `setup_mcp_servers.py`) |
| **Run mechanism** | `node mcp-servers/pdb-server/build/index.js` |

**Tools:**

| Tool | Description |
|------|-------------|
| `search_structures` | Search PDB by keyword, protein name, or PDB ID |
| `get_structure_info` | Detailed info for a specific PDB entry (resolution, method, chains) |
| `download_structure` | Download coordinates in PDB, mmCIF, mmTF, or XML |
| `search_by_uniprot` | Find PDB structures linked to a UniProt accession |
| `get_structure_quality` | Validation metrics — R-work, R-free, Ramachandran, clash scores |

**Use case:** When you need experimentally determined 3D structures (X-ray,
cryo-EM, NMR). PDB contains real observed structures, not predictions.

---

### 3. AlphaFold MCP

| | |
|---|---|
| **Source** | [Augmented-Nature/AlphaFold-MCP-Server](https://github.com/Augmented-Nature/AlphaFold-MCP-Server) |
| **Language** | TypeScript / Node.js |
| **Backend API** | `https://alphafold.ebi.ac.uk/api/` |
| **Install** | `git clone` + `npm install` + `npm run build` (automated by `setup_mcp_servers.py`) |
| **Run mechanism** | `node mcp-servers/alphafold-server/build/index.js` |

**Tools:**

| Tool | Description |
|------|-------------|
| `get_structure` | AlphaFold predicted structure by UniProt ID (JSON, PDB, CIF, BCIF) |
| `check_availability` | Check if a prediction exists for a UniProt ID |
| `search_structures` | Find predictions by protein/gene name |
| `get_confidence_scores` | Per-residue pLDDT confidence scores |
| `analyze_confidence_regions` | High/low confidence region analysis |
| `compare_structures` | Side-by-side comparison of multiple predictions |
| `batch_structure_info` | Bulk retrieval for up to 50 proteins |
| `export_for_pymol` / `export_for_chimerax` | Visualization-ready output |

**Use case:** When no experimental structure exists in PDB, or when you want
per-residue confidence metrics. AlphaFold covers ~200M proteins vs ~220K in PDB.

---

## Key Differences

| | UniProt | PDB | AlphaFold |
|---|---------|-----|-----------|
| **Data type** | Sequence, function, annotations | Experimental 3D structures | Predicted 3D structures |
| **Coverage** | ~250M protein entries | ~220K structures | ~200M predictions |
| **Language** | Python | Node.js | Node.js |
| **Source** | UniProt Consortium | RCSB (Worldwide PDB) | DeepMind / EBI |
| **Strengths** | Function, GO terms, disease links, ID mapping | Real atomic coordinates, quality metrics | Near-universal coverage, confidence scores |
| **Limitations** | No 3D structure data | Only proteins with experimental structures | Predictions only — no experimental validation |

**They complement each other:** Use UniProt for "what does this protein do?",
PDB for "what does the crystal structure look like?", and AlphaFold for
"what's the predicted structure where no crystal exists?"

---

## Debug Logging

When `DEBUG=1` (default), the `on_pre_tool_use` and `on_post_tool_use` hooks in
`main.py` log every tool call:

```
  [debug] → calling tool: uniprot-fetch_entry
  [debug]   args: {'accession': 'P04637'}
  [debug] ← tool done: uniprot-fetch_entry (result=success, 844 chars)
  [debug] → calling tool: pdb-search_by_uniprot
  [debug]   args: {'uniprot_id': 'P04637'}
  [debug] ← tool done: pdb-search_by_uniprot (result=success, 1203 chars)
```

The tool name prefix (`uniprot-`, `pdb-`, `alphafold-`) tells you which MCP
server handled the call.

---

## Adding More Servers

To add a new MCP server:

1. **If Python (PyPI):** Add it to `pyproject.toml` dependencies, create a
   wrapper if needed, and add a block in `build_mcp_servers()`
2. **If Node.js (GitHub):** Add it to `setup_mcp_servers.py` SERVERS list, and
   add a block in `build_mcp_servers()`
3. **If remote (HTTP/SSE):** Use `"type": "http"` with a `"url"` instead of
   `"command"`

Augmented Nature maintains many more servers (NCBI, KEGG, PubChem, STRING,
Reactome, Ensembl, etc.) that can be added the same way.