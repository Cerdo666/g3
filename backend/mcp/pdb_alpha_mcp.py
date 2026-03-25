"""
One-time setup: clone and build the Node.js MCP servers.
Run with:  uv run python setup_mcp_servers.py
"""

import os
import subprocess
import sys
import shutil

BASE = os.path.dirname(os.path.dirname(__file__))  # Go up to backend/
SERVERS_DIR = os.path.join(BASE, "mcp-servers")

SERVERS = [
    {
        "name": "pdb-server",
        "repo": "https://github.com/Augmented-Nature/PDB-MCP-Server.git",
    },
    {
        "name": "alphafold-server",
        "repo": "https://github.com/Augmented-Nature/AlphaFold-MCP-Server.git",
    },
]


def run(cmd: list[str], cwd: str) -> None:
    print(f"  $ {' '.join(cmd)}")
    # If it's npm, find the full path
    if cmd[0] == "npm":
        npm_path = shutil.which("npm")
        if npm_path:
            cmd = [npm_path] + cmd[1:]
    subprocess.check_call(cmd, cwd=cwd)


def main() -> None:
    os.makedirs(SERVERS_DIR, exist_ok=True)

    for server in SERVERS:
        dest = os.path.join(SERVERS_DIR, server["name"])
        if os.path.isdir(dest):
            print(f"✓ {server['name']} already cloned")
        else:
            print(f"⬇ Cloning {server['name']}...")
            run(["git", "clone", "--depth", "1", server["repo"], dest], cwd=SERVERS_DIR)

        print(f"📦 Installing {server['name']} deps...")
        run(["npm", "install"], cwd=dest)

        print(f"🔨 Building {server['name']}...")
        run(["npm", "run", "build"], cwd=dest)

        index_js = os.path.join(dest, "build", "index.js")
        if os.path.isfile(index_js):
            print(f"✓ {server['name']} ready")
        else:
            print(f"✗ {server['name']} build failed — {index_js} not found")
            sys.exit(1)

        print()

    print("All MCP servers ready!")


if __name__ == "__main__":
    main()