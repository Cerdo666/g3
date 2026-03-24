import asyncio
import os
import shutil
import sys

from copilot import CopilotClient, PermissionHandler

## default DEBUG mode for console app!
DEBUG = os.environ.get("DEBUG", "1") in ("1", "true", "yes")

SYSTEM_MESSAGE = (
    "You are a helpful bio-research assistant. "
    "You help researchers find information about genomics, proteins, "
    "articles in bio-databases, and related topics. "
    "You have access to: "
    "UniProt (protein entries, sequences, ID mapping), "
    "PDB (3D protein structures from RCSB Protein Data Bank), and "
    "AlphaFold (predicted protein structures and confidence scores). "
    "Use these tools to look up data when answering questions. "
    "Be concise and accurate."
)


def build_mcp_servers() -> dict:
    """Build MCP server configs. Add new servers here as the project grows."""
    servers: dict = {}
    base_dir = os.path.dirname(__file__)
    node_cmd = shutil.which("node")

    # ── UniProt MCP — protein database (pip: uniprot-mcp) ──
    # We use a wrapper script that fixes a sync-hooks bug in v0.1.0.
    wrapper = os.path.join(base_dir, "uniprot_mcp_wrapper.py")
    python_cmd = shutil.which("python") or sys.executable

    if os.path.isfile(wrapper):
        servers["uniprot"] = {
            "type": "local",
            "command": python_cmd,
            "args": [wrapper],
            "tools": ["*"],
        }
    else:
        print("⚠  uniprot_mcp_wrapper.py not found — UniProt tools disabled")

    # ── PDB MCP — RCSB Protein Data Bank (Augmented-Nature, Node.js) ──
    pdb_index = os.path.join(base_dir, "mcp-servers", "pdb-server", "build", "index.js")
    if node_cmd and os.path.isfile(pdb_index):
        servers["pdb"] = {
            "type": "local",
            "command": node_cmd,
            "args": [pdb_index],
            "tools": ["*"],
        }
    else:
        print("⚠  PDB MCP server not found — PDB tools disabled")

    # ── AlphaFold MCP — predicted protein structures (Augmented-Nature, Node.js) ──
    af_index = os.path.join(base_dir, "mcp-servers", "alphafold-server", "build", "index.js")
    if node_cmd and os.path.isfile(af_index):
        servers["alphafold"] = {
            "type": "local",
            "command": node_cmd,
            "args": [af_index],
            "tools": ["*"],
        }
    else:
        print("⚠  AlphaFold MCP server not found — AlphaFold tools disabled")

    return servers


# ── Hook handlers for debug logging ──────────────────────────────────


def _debug(msg: str):
    if DEBUG:
        print(f"  [debug] {msg}", flush=True)


async def _on_pre_tool_use(input, invocation):
    tool = input.get("toolName", "?")
    args = input.get("toolArgs", {})
    _debug(f"→ calling tool: {tool}")
    if args:
        summary = {k: (str(v)[:200] + "…" if len(str(v)) > 200 else v) for k, v in args.items()}
        _debug(f"  args: {summary}")
    return {"permissionDecision": "allow"}


async def _on_post_tool_use(input, invocation):
    tool = input.get("toolName", "?")
    result = input.get("toolResult", {})
    result_type = result.get("resultType", "?") if isinstance(result, dict) else "?"
    # Show truncated result or error for diagnosis
    text = ""
    if isinstance(result, dict):
        text = result.get("textResultForLlm", "") or result.get("error", "") or ""
    else:
        text = str(result)
    snippet = text[:300] + "…" if len(text) > 300 else text
    if result_type == "error" or "error" in str(result).lower()[:200]:
        _debug(f"✗ tool FAILED: {tool} — {snippet}")
    else:
        _debug(f"← tool done: {tool} (result={result_type}, {len(text)} chars)")
        if DEBUG and snippet:
            _debug(f"  response: {snippet}")
    return {}


async def _on_session_start(input, invocation):
    source = input.get("source", "unknown")
    _debug(f"session started (source={source})")
    return {}

async def main():
    client = CopilotClient()
    await client.start()

    mcp_servers = build_mcp_servers()
    if mcp_servers:
        print(f"MCP servers: {', '.join(mcp_servers.keys())}")

    session = await client.create_session(
        {
            "model": "gpt-4o",
            "streaming": True,
            "system_message": {"content": SYSTEM_MESSAGE},
            "on_permission_request": PermissionHandler.approve_all,
            "mcp_servers": mcp_servers,
            "hooks": {
                "on_pre_tool_use": _on_pre_tool_use,
                "on_post_tool_use": _on_post_tool_use,
                "on_session_start": _on_session_start,
            },
        }
    )

    print("=== Bio-Research Console Chat ===")
    print("Type your message and press Enter. Type 'quit' or 'exit' to stop.\n")

    try:
        while True:
            try:
                user_input = input("You: ").strip()
            except EOFError:
                break

            if not user_input:
                continue
            if user_input.lower() in ("quit", "exit"):
                break

            # Event to signal the turn is done
            done = asyncio.Event()
            printed_newline = False

            def on_event(event):
                nonlocal printed_newline
                etype = event.type.value
                if etype == "assistant.message_delta":
                    delta = event.data.delta_content or ""
                    if not printed_newline:
                        print("Bot: ", end="", flush=True)
                        printed_newline = True
                    print(delta, end="", flush=True)
                elif etype == "session.idle":
                    if printed_newline:
                        print()  # newline after streamed response
                    done.set()

            unsubscribe = session.on(on_event)
            await session.send({"prompt": user_input})
            await done.wait()
            unsubscribe()

    except KeyboardInterrupt:
        print("\nInterrupted.")

    print("Goodbye!")
    await session.disconnect()
    await client.stop()


def run():
    asyncio.run(main())


if __name__ == "__main__":
    run()