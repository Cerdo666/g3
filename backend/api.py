# backend/api.py
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import bcrypt
from bson import ObjectId
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr

from copilot import CopilotClient
from copilot.session import PermissionHandler
from mcp import build_mcp_servers, on_pre_tool_use, on_post_tool_use, on_session_start, tool_events, set_mcp_server_names
from streaming import SSEEvent
from database import init_indexes, users, chat_sessions, export_logs
from jwt_utils import create_access_token, create_refresh_token, verify_token

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
    await init_indexes()      # ensure MongoDB indexes exist
    await get_session()       # pre-calienta la sesión al arrancar
    yield
    if _session:
        try:
            await _session.disconnect()
        except (BrokenPipeError, OSError, RuntimeError) as exc:
            # Container shutdown can close stdio before the SDK sends session.destroy.
            logger.warning("Ignoring session disconnect error during shutdown: %s", exc)

    if _client:
        try:
            await _client.stop()
        except (BrokenPipeError, OSError, RuntimeError) as exc:
            logger.warning("Ignoring client stop error during shutdown: %s", exc)


# ── App FastAPI ───────────────────────────────────────────────────────
app = FastAPI(title="OncoQuery API", lifespan=lifespan)

origins = [o.strip().rstrip("/") for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")]
logger.info("CORS origins: %s", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"status": "ok"}


# ── Modelos ───────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Endpoints ─────────────────────────────────────────────────────────
@app.post("/register")
async def register(req: RegisterRequest):
    """Register a new user and return JWT tokens."""
    existing = await users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    doc = {
        "email": req.email,
        "name": req.name,
        "hashed_password": hashed,
        "role": "user",
        "refresh_tokens": [],
        "created_at": datetime.now(timezone.utc),
    }
    result = await users.insert_one(doc)
    user_id = str(result.inserted_id)
    
    # Generate tokens
    access_token = create_access_token(user_id, req.email)
    refresh_token = create_refresh_token(user_id)
    
    # Store refresh token in database
    await users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"refresh_tokens": refresh_token}}
    )
    
    return {
        "ok": True,
        "user_id": user_id,
        "email": req.email,
        "name": req.name,
        "role": "user",
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.post("/login")
async def login(req: LoginRequest):
    """Authenticate user with email and password, return JWT tokens."""
    user = await users.find_one({"email": req.email})
    if not user or not bcrypt.checkpw(req.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    
    # Generate tokens
    access_token = create_access_token(user_id, req.email)
    refresh_token = create_refresh_token(user_id)
    
    # Store refresh token in database
    await users.update_one(
        {"_id": user["_id"]},
        {"$push": {"refresh_tokens": refresh_token}}
    )
    
    return {
        "ok": True,
        "user_id": user_id,
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "access_token": access_token,
        "token_type": "bearer"
    }


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@app.post("/refresh")
async def refresh(req: RefreshTokenRequest):
    """Exchange a refresh token for a new access token."""
    payload = verify_token(req.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user_id = payload.get("sub")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid user ID in token")
    
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user or req.refresh_token not in user.get("refresh_tokens", []):
        raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")
    
    # Generate new access token
    access_token = create_access_token(user_id, user["email"])
    
    return {
        "ok": True,
        "access_token": access_token,
        "token_type": "bearer"
    }


# ── Auth helpers ──────────────────────────────────────────────────────
async def verify_jwt(authorization: str = Header(None)) -> str:
    """Verify JWT access token and return user_id. Raises 401 if invalid."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid user in token")
    
    return user_id


# ── Admin helpers ─────────────────────────────────────────────────────
async def require_admin(x_user_id: str = Header(...)):
    """Verify the caller is an admin. Expects X-User-Id header."""
    if not ObjectId.is_valid(x_user_id):
        raise HTTPException(status_code=401, detail="Invalid user ID")
    caller = await users.find_one({"_id": ObjectId(x_user_id)})
    if not caller or caller.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return caller


# ── Admin Endpoints ───────────────────────────────────────────────────
@app.get("/admin/users")
async def admin_list_users(x_user_id: str = Header(...)):
    """List all users (admin only)."""
    await require_admin(x_user_id)
    cursor = users.find({}, {"hashed_password": 0}).sort("created_at", -1)
    result = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        result.append(doc)
    return {"ok": True, "users": result}


@app.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, x_user_id: str = Header(...)):
    """Delete a user (admin only). Cannot delete yourself."""
    await require_admin(x_user_id)
    if user_id == x_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    result = await users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


class RoleUpdate(BaseModel):
    role: str


@app.patch("/admin/users/{user_id}/role")
async def admin_change_role(user_id: str, body: RoleUpdate, x_user_id: str = Header(...)):
    """Change a user's role (admin only)."""
    await require_admin(x_user_id)
    if body.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    result = await users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": body.role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@app.get("/admin/stats")
async def admin_stats(x_user_id: str = Header(...)):
    """Get platform stats (admin only)."""
    await require_admin(x_user_id)
    total_users = await users.count_documents({})
    total_sessions = await chat_sessions.count_documents({})
    total_exports = await export_logs.count_documents({})
    return {
        "ok": True,
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_exports": total_exports,
    }


@app.get("/status")
async def status():
    """Devuelve qué MCP servers están activos."""
    servers = build_mcp_servers()
    return {
        "ok": True,
        "mcp_servers": list(servers.keys()),
    }


@app.post("/chat")
async def chat(req: ChatRequest, user_id: str = Depends(verify_jwt)):
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