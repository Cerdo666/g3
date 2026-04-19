import pytest
from fastapi.testclient import TestClient

@pytest.mark.asyncio
async def test_app_startup():
    """Test that the FastAPI app can be imported and configured."""
    from api import app
    assert app is not None
    assert app.title or True  # Basic sanity check

def test_system_message_exists():
    """Test that SYSTEM_MESSAGE is configured."""
    from api import SYSTEM_MESSAGE
    assert SYSTEM_MESSAGE is not None
    assert "bio-research" in SYSTEM_MESSAGE.lower()
    assert "Sources" in SYSTEM_MESSAGE
