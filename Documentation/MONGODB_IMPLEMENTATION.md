# MongoDB Implementation Documentation

## Overview

This document describes the MongoDB implementation used by OncoQuery, including connection setup, schema/collections, index strategy, runtime initialization, deployment configuration (Docker/Azure), and common issues encountered during migration to MongoDB Atlas.

---

## Database Stack

### Libraries and Driver
- Framework integration: FastAPI (async backend)
- MongoDB driver: Motor (`motor.motor_asyncio.AsyncIOMotorClient`)
- TLS certificate bundle: certifi
- SRV/Atlas DNS support: dnspython

### Primary MongoDB Module
- Location: `backend/database.py`
- Responsibilities:
  - Read environment variables (`MONGO_URI`, `MONGO_DB`)
  - Initialize async MongoDB client
  - Expose collection handles
  - Create required indexes at app startup

---

## Connection Configuration

### Environment Variables
- `MONGO_URI`
  - Default: `mongodb://localhost:27017`
  - Atlas example: `mongodb+srv://<user>:<password>@<cluster-url>/?retryWrites=true&w=majority`
- `MONGO_DB`
  - Default: `oncoquery`

### Current Client Initialization
In `backend/database.py`:

```python
client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = client[DB_NAME]
```

### Why TLS/Certifi Is Used
Atlas requires secure TLS connections. Passing `tlsCAFile=certifi.where()` ensures the container/runtime can validate Atlas certificates consistently across local and cloud environments.

---

## Collections and Data Model

The project currently defines these collections:
- `users`
- `projects`
- `chat_sessions`
- `export_logs`

### 1) `users`
Purpose:
- Stores application users and auth data.

Main fields:
- `_id` (ObjectId)
- `email` (unique)
- `name`
- `hashed_password`
- `role` (`user` or `admin`)
- `created_at`

Active usage in API:
- Register (`POST /register`)
- Login (`POST /login`)
- Admin user management/list/delete/role update

### 2) `projects`
Purpose:
- Organizes chat sessions by user-defined project/folder.

Status:
- Collection and index are provisioned.
- Full CRUD endpoint surface is not currently implemented in `api.py`.

### 3) `chat_sessions`
Purpose:
- Stores user chat session metadata/history references.

Status:
- Collection and indexes are provisioned.
- Used in admin stats counting.
- Streaming chat endpoint currently streams responses and tool events, but does not yet persist session/message payloads in the shown API implementation.

### 4) `export_logs`
Purpose:
- Tracks export operations (for example PDF/CSV workflow).

Status:
- Collection and indexes are provisioned.
- Used in admin stats counting.

---

## Index Strategy

Indexes are created by `init_indexes()` in `backend/database.py` and executed during app startup.

Defined indexes:
- `users.email` unique
- `projects.user_id`
- `chat_sessions.user_id`
- `chat_sessions.project_id`
- `chat_sessions.updated_at` descending
- `export_logs.user_id`
- `export_logs.session_id`

### Startup Hook
In `backend/api.py` lifespan:
- `await init_indexes()` runs before serving requests.

This ensures required indexes are present in fresh environments (local, staging, production) without a separate migration command.

---

## Runtime Integration in API

### Import Wiring
`backend/api.py` imports:
- `users`
- `chat_sessions`
- `export_logs`
- `init_indexes`

### Auth and Admin Flows Using MongoDB
- Register validates unique email and inserts hashed password.
- Login fetches user by email and verifies bcrypt hash.
- Admin endpoints query and mutate user records.
- Admin stats uses `count_documents` on users/sessions/exports.

### ObjectId Handling
Admin-protected endpoints validate incoming IDs with `ObjectId.is_valid(...)` before Mongo operations, reducing malformed-ID errors.

---

## Deployment and Infrastructure Notes

### Docker
The backend image includes:
- Python 3.12 runtime
- CA certificates (`ca-certificates` package)
- Python dependencies from `pyproject.toml` (including Motor, dnspython, certifi)

This is important for Atlas TLS validation from containers.

### Azure Container Apps
For production deployment, set environment variables in Container App configuration:
- `MONGO_URI`
- `MONGO_DB`

Recommended:
- Store URI in Azure secrets and reference it from environment variables.
- Avoid hardcoding connection strings in code or Dockerfile.

---

## Local Development and Verification

From `backend/`:

```bash
# Ensure dependencies are installed
uv sync

# Run API
uv run python api.py
```

Quick checks:
- API health: `GET /`
- Index initialization: startup should complete without Mongo errors
- Register/Login path validates `users` collection behavior

---

## Difficulties Encountered and Solutions

### 1) Atlas TLS / Certificate Validation Errors
Problem:
- Cloud/container runtime failed TLS handshake against MongoDB Atlas.

Solution:
- Added certifi dependency.
- Passed `tlsCAFile=certifi.where()` in Mongo client initialization.
- Ensured OS CA certificates are installed in Docker image.

### 2) Atlas SRV Connection Resolution Issues
Problem:
- `mongodb+srv://` URI failures in some environments.

Solution:
- Added dnspython dependency required by SRV-based Mongo URIs.

### 3) Duplicate Email Registration
Problem:
- Multiple users could be inserted with same email if uniqueness is not enforced.

Solution:
- Enforced unique index on `users.email`.
- Added API guard returning HTTP 409 when email already exists.

### 4) Invalid User ID Inputs in Admin Endpoints
Problem:
- Invalid IDs can raise exceptions on Mongo queries.

Solution:
- Validated IDs with `ObjectId.is_valid` and returned clear HTTP errors.

---

## Current Limitations

- No dedicated migration framework (index creation is startup-driven).
- No transaction usage yet for multi-document atomic workflows.
- Session/message persistence model exists in schema but is only partially wired in current API implementation.

---

## Recommended Next Improvements

1. Add repository/service layer for Mongo access to reduce endpoint-level DB logic.
2. Add explicit chat session persistence in `/chat` flow (session headers, message append, source attribution).
3. Introduce schema validation models per collection for write consistency.
4. Add Mongo integration tests against a test database (or containerized Mongo instance).
5. Add retention/TTL policy where applicable (for temporary logs/sessions if desired).
6. Add health check that validates DB connectivity (for orchestration readiness).

---

## Related Files

- `backend/database.py`
- `backend/api.py`
- `Documentation/schema.json`
- `backend/pyproject.toml`
- `backend/Dockerfile`
