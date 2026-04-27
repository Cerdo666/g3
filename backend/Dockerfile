FROM python:3.12-slim

# Install UV and Node.js (needed for MCP servers)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl git build-essential ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \        
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all code first (including mcp and streaming directories)
COPY . .

# Install Python dependencies
RUN uv sync --frozen

# Build the Node.js MCP servers at build time
RUN uv run --frozen python mcp/pdb_alpha_mcp.py

EXPOSE 8080

CMD ["uv", "run", "python", "api.py"]