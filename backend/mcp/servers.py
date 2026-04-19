import logging
import os
import shutil
import sys

from .hooks import set_mcp_server_names

logger = logging.getLogger("mcp.servers")

# Base directory is backend/, one level up from this file
_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))


def _node_server(name: str, node_cmd: str) -> dict | None:
    """Helper: devuelve config de un MCP server Node.js o None si no está buildeado."""
    server_dir = os.path.join(_BACKEND_DIR, "mcp-servers", name)
    index_js = os.path.join(server_dir, "build", "index.js")
    if node_cmd and os.path.isfile(index_js):
        return {
            "type": "local",
            "command": node_cmd,
            "args": [index_js],
            "tools": ["*"],
        }
    logger.warning("%s not found or Node.js not available — tools disabled", name)
    return None


def build_mcp_servers() -> dict:
    """
    Construye la configuración de todos los MCP servers activos.
    Añade nuevos servers aquí a medida que el proyecto crece.
    """
    servers: dict = {}
    node_cmd = shutil.which("node")
    python_cmd = shutil.which("python") or sys.executable

    # ── UniProt — proteínas y secuencias (Python, pip: uniprot-mcp) ───
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

    # ── PDB — estructuras 3D de proteínas (RCSB) ──────────────────────
    if cfg := _node_server("pdb-server", node_cmd):
        servers["pdb"] = cfg

    # ── AlphaFold — predicción de estructuras ─────────────────────────
    if cfg := _node_server("alphafold-server", node_cmd):
        servers["alphafold"] = cfg

    # ── PubMed — literatura biomédica (36M+ artículos, NCBI) ─────────
    if cfg := _node_server("pubmed-server", node_cmd):
        # Opcional: añade tu NCBI API key para 10 req/s en vez de 3
        ncbi_key = os.environ.get("NCBI_API_KEY")
        ncbi_email = os.environ.get("NCBI_EMAIL")
        if ncbi_key and ncbi_email:
            cfg["env"] = {
                "NCBI_API_KEY": ncbi_key,
                "NCBI_EMAIL": ncbi_email,
            }
            logger.info("PubMed: using NCBI API key (10 req/s)")
        else:
            logger.info("PubMed: no NCBI_API_KEY set, using anonymous rate limit (3 req/s)")
        servers["pubmed"] = cfg

    # ── ClinicalTrials.gov — ensayos clínicos ─────────────────────────
    if cfg := _node_server("clinicaltrials-server", node_cmd):
        servers["clinicaltrials"] = cfg

    # ── ChEMBL — base de datos de fármacos y moléculas bioactivas ─────
    if cfg := _node_server("chembl-server", node_cmd):
        servers["chembl"] = cfg

    set_mcp_server_names(list(servers.keys()))

    active = list(servers.keys())
    logger.info("Active MCP servers (%d): %s", len(active), ", ".join(active))

    return servers