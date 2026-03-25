"""
Wrapper that fixes the sync-hook bug in uniprot-mcp v0.1.0 before starting
the MCP server.

Bug: uniprot_mcp.obs.create_httpx_event_hooks returns sync functions, but
httpx.AsyncClient requires async hooks → "NoneType can't be used in await".
"""

import logging
import time
from typing import Any

import uniprot_mcp.obs as obs


def _patched_create_httpx_event_hooks(
    logger: logging.Logger | None = None,
) -> dict[str, list]:
    log = logger or logging.getLogger("uniprot_mcp.httpx")

    async def on_request(request: Any) -> None:
        request.extensions["start_ts"] = time.perf_counter()

    async def on_response(response: Any) -> None:
        start = response.request.extensions.get("start_ts")
        duration_ms = None
        if start is not None:
            duration_ms = round((time.perf_counter() - start) * 1000.0, 2)
        log.info(
            "httpx_request",
            extra={
                "method": response.request.method,
                "url": str(response.request.url),
                "status": response.status_code,
                "duration_ms": duration_ms,
                "request_id": obs.get_request_id(),
            },
        )

    return {"request": [on_request], "response": [on_response]}


# Patch before anything imports it
obs.create_httpx_event_hooks = _patched_create_httpx_event_hooks

# Also patch in the client module if already imported
try:
    import uniprot_mcp.adapters.uniprot_client as uc
    uc.create_httpx_event_hooks = _patched_create_httpx_event_hooks
except ImportError:
    pass

# Now run the actual server
from uniprot_mcp.server import mcp  # noqa: E402

if __name__ == "__main__":
    mcp.run(transport="stdio")