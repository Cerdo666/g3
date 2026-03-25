import logging
from collections import deque

logger = logging.getLogger("mcp.hooks")

# Tool events are pushed here by hooks and drained by the SSE event_stream.
# Using a deque for thread-safe append/popleft.
tool_events: deque[dict] = deque()

# Populated at session init with the registered MCP server names.
_mcp_server_names: list[str] = []

def set_mcp_server_names(names: list[str]):
    """Call once after build_mcp_servers() to register known server names."""
    _mcp_server_names.clear()
    _mcp_server_names.extend(names)

def _classify_tool(tool_name: str) -> tuple[str, str]:
    """Return (source, display_name) for a tool.

    MCP tools arrive as 'servername-toolname' (e.g. 'uniprot-fetch_entry').
    Built-in tools are plain names (e.g. 'report_intent', 'powershell').
    """
    for server in _mcp_server_names:
        prefix = f"{server}-"
        if tool_name.startswith(prefix):
            return server, tool_name[len(prefix):]
    return "builtin", tool_name


async def on_pre_tool_use(input, invocation):
    tool = input.get("toolName", "?")
    args = input.get("toolArgs", {})
    source, display = _classify_tool(tool)
    logger.debug("→ calling tool: %s (source=%s)", tool, source)
    if args:
        summary = {k: (str(v)[:200] + "…" if len(str(v)) > 200 else v) for k, v in args.items()}
        logger.debug("  args: %s", summary)
    tool_events.append({"tool": display, "status": "calling", "source": source})
    return {"permissionDecision": "allow"}


async def on_post_tool_use(input, invocation):
    tool = input.get("toolName", "?")
    source, display = _classify_tool(tool)
    result = input.get("toolResult", {})
    result_type = result.get("resultType", "?") if isinstance(result, dict) else "?"
    text = ""
    if isinstance(result, dict):
        text = result.get("textResultForLlm", "") or result.get("error", "") or ""
    else:
        text = str(result)
    snippet = text[:300] + "…" if len(text) > 300 else text
    is_error = result_type == "error"
    if is_error:
        logger.warning("✗ tool FAILED: %s — %s", tool, snippet)
        tool_events.append({"tool": display, "status": "error", "source": source})
    else:
        logger.debug("← tool done: %s (source=%s, result=%s, %d chars)", tool, source, result_type, len(text))
        logger.debug("  response: %s", snippet)
        tool_events.append({"tool": display, "status": "done", "source": source})
    return {}


async def on_session_start(input, invocation):
    source = input.get("source", "unknown")
    logger.debug("session started (source=%s)", source)
    return {}
