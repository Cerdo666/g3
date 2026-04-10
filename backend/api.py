# backend/api.py
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from copilot import CopilotClient
from copilot.session import PermissionHandler
from mcp import build_mcp_servers, on_pre_tool_use, on_post_tool_use, on_session_start, tool_events, set_mcp_server_names
from streaming import SSEEvent

logger = logging.getLogger("api")

# ── Configuration ─────────────────────────────────────────────────────
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
    #INSTRUCCIÓN CLAVE PARA CUMPLIR CON LA US #6:
    "Critical instruction: "
    "If you retrieve any data using the MCP servers (UniProt, PDB, or AlphaFold), "
    "you MUST always end your response with a section titled '### Sources' "
    "that contains a bullet list of the exact direct public URLs to the original entries you consulted. "
    "Use only the official public URLs. "
    "Add the '### Sources' section if and only if you used at least one MCP server in that response. "
    "Do not add the Sources section if no MCP server was used, unless the user explicitly requests it."
)


# ── Estado global de la sesión (hardcodeada, un solo usuario) ─────────
_client: CopilotClient | None = None
_session = None
_session_lock = asyncio.Lock()


async def get_session():
    """Devuelve siempre la misma sesión reutilizada."""
    global _client, _session

    async with _session_lock:
        if _session is not None:
            return _session

        logger.info("Starting Copilot session...")
        _client = CopilotClient()
        await _client.start()

        mcp_servers = build_mcp_servers()
        if mcp_servers:
            logger.info("MCP servers: %s", ", ".join(mcp_servers.keys()))

        _session = await _client.create_session(
            model="claude-haiku-4.5",
            streaming=True,
            system_message={"content": SYSTEM_MESSAGE},
            on_permission_request=PermissionHandler.approve_all,
            mcp_servers=mcp_servers,
            hooks={
                "on_pre_tool_use": on_pre_tool_use,
                "on_post_tool_use": on_post_tool_use,
                "on_session_start": on_session_start,
            },
        )

        logger.info("Session ready ✓")
        return _session


# ── Lifespan: arranca la sesión al iniciar FastAPI ────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_session()   # pre-calienta la sesión al arrancar
    yield
    if _session:
        await _session.disconnect()
    if _client:
        await _client.stop()


# ── App FastAPI ───────────────────────────────────────────────────────
app = FastAPI(title="OncoQuery API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health():
    return {"status": "ok"}


# ── Modelos ───────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────
@app.get("/status")
async def status():
    """Devuelve qué MCP servers están activos."""
    servers = build_mcp_servers()
    return {
        "ok": True,
        "mcp_servers": list(servers.keys()),
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Recibe un mensaje y devuelve la respuesta como SSE streaming.
    El frontend lee los eventos con EventSource o fetch+ReadableStream.
    """
    session = await get_session()

    async def event_stream():
        done = asyncio.Event()
        buffer = []

        # Clear any stale tool events from previous requests
        tool_events.clear()

        def on_event(event):
            etype = event.type.value
            if etype == "assistant.message_delta":
                delta = event.data.delta_content or ""
                if delta:
                    buffer.append(SSEEvent.content(delta))
            elif etype == "session.idle":
                done.set()

        unsubscribe = session.on(on_event)
        await session.send(req.message)

        while not done.is_set():
            await asyncio.sleep(0.05)
            # Drain tool events from hooks
            while tool_events:
                te = tool_events.popleft()
                buffer.append(SSEEvent.tool_call(te["tool"], te["status"], te["source"]))
            while buffer:
                yield buffer.pop(0).to_sse()

        # Drain remaining
        while tool_events:
            te = tool_events.popleft()
            buffer.append(SSEEvent.tool_call(te["tool"], te["status"], te["source"]))
        while buffer:
            yield buffer.pop(0).to_sse()

        unsubscribe()
        yield SSEEvent.done().to_sse()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import os
    import uvicorn

    log_level = os.environ.get("LOG_LEVEL", "info").lower()
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    uvicorn.run("api:app", host="0.0.0.0", port=8080, reload=False, log_level=log_level)