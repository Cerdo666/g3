import pytest
import asyncio
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def mock_copilot_client():
    """Mock CopilotClient for testing without actual SDK."""
    mock_client = AsyncMock()
    mock_client.close = AsyncMock()
    return mock_client

@pytest.fixture
async def mock_db():
    """Mock database connections."""
    mock_users = AsyncMock()
    mock_sessions = AsyncMock()
    mock_export = AsyncMock()
    
    return {
        "users": mock_users,
        "chat_sessions": mock_sessions,
        "export_logs": mock_export,
    }
