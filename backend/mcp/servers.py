import logging
import os
import shutil
import sys

from .hooks import set_mcp_server_names

logger = logging.getLogger("mcp.servers")

# Base directory is backend/, one level up from this file
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))


def build_mcp_servers() -> dict:
    """Build MCP server configs. Add new servers here as the project grows."""
    servers: dict = {}
    node_cmd = shutil.which("node")
    python_cmd = shutil.which("python") or sys.executable

    # ── UniProt MCP — protein database (pip: uniprot-mcp) ──
    wrapper = os.path.join(_BACKEND_DIR, "mcp", "uniprot_mcp_wrapper.py")
    if os.path.isfile(wrapper):
        servers["uniprot"] = {
            "type": "local",
            "command": python_cmd,
            "args": [wrapper],
            "tools": ["*"],
        }
    else:
        logger.warning("uniprot_mcp_wrapper.py not found — UniProt tools disabled")

    # ── PDB MCP — RCSB Protein Data Bank (Node.js) ──
    pdb_server_dir = os.path.join(_BACKEND_DIR, "mcp-servers", "pdb-server")
    pdb_index_js = os.path.join(pdb_server_dir, "build", "index.js")
    if node_cmd and os.path.isfile(pdb_index_js):
        servers["pdb"] = {
            "type": "local",
            "command": node_cmd,
            "args": [pdb_index_js],
            "tools": ["*"],
        }
    else:
        logger.warning("PDB MCP server not found or Node.js not available — PDB tools disabled")

    # ── AlphaFold MCP — structure prediction (Node.js) ──
    alphafold_server_dir = os.path.join(_BACKEND_DIR, "mcp-servers", "alphafold-server")
    alphafold_index_js = os.path.join(alphafold_server_dir, "build", "index.js")
    if node_cmd and os.path.isfile(alphafold_index_js):
        servers["alphafold"] = {
            "type": "local",
            "command": node_cmd,
            "args": [alphafold_index_js],
            "tools": ["*"],
        }
    else:
        logger.warning("AlphaFold MCP server not found or Node.js not available — AlphaFold tools disabled")

    set_mcp_server_names(list(servers.keys()))
    return servers
