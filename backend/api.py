# backend/api.py
import asyncio
import os
import shutil
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Importamos exactamente lo mismo que main.py
from copilot import CopilotClient, PermissionHandler

# ── Reutilizamos todo de main.py sin tocarlo ──────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
from main import SYSTEM_MESSAGE, build_mcp_servers, _on_pre_tool_use, _on_post_tool_use, _on_session_start

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

        print("Iniciando sesión Copilot...", flush=True)
        _client = CopilotClient()
        await _client.start()

        mcp_servers = build_mcp_servers()
        if mcp_servers:
            print(f"MCP servers: {', '.join(mcp_servers.keys())}", flush=True)

        _session = await _client.create_session({
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
        })

        print("Sesión lista ✓", flush=True)
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

        def on_event(event):
            etype = event.type.value
            if etype == "assistant.message_delta":
                delta = event.data.delta_content or ""
                if delta:
                    buffer.append(delta)
            elif etype == "session.idle":
                done.set()

        unsubscribe = session.on(on_event)
        await session.send({"prompt": req.message})

        # Flush buffer mientras esperamos que termine
        while not done.is_set():
            await asyncio.sleep(0.05)
            while buffer:
                chunk = buffer.pop(0)
                # Formato SSE estándar: "data: ...\n\n"
                yield f"data: {chunk}\n\n"

        # Vaciar lo que quede
        while buffer:
            chunk = buffer.pop(0)
            yield f"data: {chunk}\n\n"

        unsubscribe()
        # Señal de fin para el frontend
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)