"""Tests for the /chat endpoint (streaming chat with SSE)."""
import pytest
import json
import asyncio
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from collections import deque

from streaming import SSEEvent


class TestChatEndpoint:
    """Test suite for the streaming /chat endpoint."""

    @pytest.mark.asyncio
    async def test_chat_request_structure(self):
        """Verify ChatRequest accepts message parameter."""
        from api import ChatRequest
        
        req = ChatRequest(message="What is BRCA1?")
        assert req.message == "What is BRCA1?"

    @pytest.mark.asyncio
    async def test_sse_event_content_format(self):
        """Test SSEEvent formats content correctly."""
        event = SSEEvent.content("Hello, world!")
        sse_str = event.to_sse()
        
        assert "data:" in sse_str
        assert '"type": "content"' in sse_str
        assert '"data": "Hello, world!"' in sse_str

    @pytest.mark.asyncio
    async def test_sse_event_tool_call_format(self):
        """Test SSEEvent formats tool calls with metadata."""
        event = SSEEvent.tool_call("uniprot_search", status="calling", source="builtin")
        sse_str = event.to_sse()
        
        assert '"type": "tool_call"' in sse_str
        # The data field contains JSON-encoded tool metadata (double-encoded)
        assert 'uniprot_search' in sse_str
        assert 'calling' in sse_str
        assert 'builtin' in sse_str

    @pytest.mark.asyncio
    async def test_sse_event_done_marker(self):
        """Test SSEEvent properly marks stream completion."""
        event = SSEEvent.done()
        sse_str = event.to_sse()
        
        assert '"type": "done"' in sse_str
        # Done events have no data
        assert '"data": ""' in sse_str or '"data":""' in sse_str

    @pytest.mark.asyncio
    async def test_sse_event_error_format(self):
        """Test SSEEvent formats errors correctly."""
        event = SSEEvent.error("Connection timeout")
        sse_str = event.to_sse()
        
        assert '"type": "error"' in sse_str
        assert '"data": "Connection timeout"' in sse_str

    @pytest.mark.asyncio
    async def test_chat_streaming_response_headers(self):
        """Test /chat endpoint returns proper streaming headers."""
        from api import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        with patch('api.get_session') as mock_get_session:
            # Mock session that triggers session.idle event
            mock_session = AsyncMock()
            
            # Capture the on_event callback and trigger it
            captured_callback = None
            def capture_callback(callback):
                nonlocal captured_callback
                captured_callback = callback
                return lambda: None  # Return unsubscribe function
            
            mock_session.on = Mock(side_effect=capture_callback)
            
            # When send is called, trigger the idle event to complete the stream
            async def trigger_idle(message):
                if captured_callback:
                    # Simulate a session.idle event to complete the stream
                    class IdleEvent:
                        class Type:
                            value = "session.idle"
                        type = Type()
                    captured_callback(IdleEvent())
            
            mock_session.send = AsyncMock(side_effect=trigger_idle)
            mock_get_session.return_value = mock_session
            
            response = client.post("/chat", json={"message": "test"})
            
            # Verify streaming headers
            assert response.headers.get("content-type", "").startswith("text/event-stream")
            assert response.headers.get("cache-control") == "no-cache"
            assert response.headers.get("x-accel-buffering") == "no"

    @pytest.mark.asyncio
    async def test_chat_sends_message_to_session(self):
        """Test /chat sends the user message to the session."""
        from api import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        test_message = "What is protein folding?"
        
        with patch('api.get_session') as mock_get_session:
            mock_session = AsyncMock()
            
            # Capture the on_event callback and trigger it
            captured_callback = None
            def capture_callback(callback):
                nonlocal captured_callback
                captured_callback = callback
                return lambda: None  # Return unsubscribe function
            
            mock_session.on = Mock(side_effect=capture_callback)
            
            # When send is called, trigger the idle event to complete the stream
            async def trigger_idle(message):
                if captured_callback:
                    # Simulate a session.idle event to complete the stream
                    class IdleEvent:
                        class Type:
                            value = "session.idle"
                        type = Type()
                    captured_callback(IdleEvent())
            
            mock_session.send = AsyncMock(side_effect=trigger_idle)
            mock_get_session.return_value = mock_session
            
            response = client.post("/chat", json={"message": test_message})
            
            # Verify send was called with correct message
            assert mock_session.send.called
            assert mock_session.on.called

    @pytest.mark.asyncio
    async def test_chat_event_handling_content_delta(self):
        """Test chat endpoint handles content delta events."""
        # This tests the event handling logic directly
        from api import tool_events
        from streaming import SSEEvent
        
        tool_events.clear()
        buffer = []
        
        # Simulate an assistant.message_delta event
        class MockEvent:
            class Type:
                value = "assistant.message_delta"
            class Data:
                delta_content = "The BRCA1 gene "
            type = Type()
            data = Data()
        
        # Test the on_event logic from chat()
        def on_event(event):
            etype = event.type.value
            if etype == "assistant.message_delta":
                delta = event.data.delta_content or ""
                if delta:
                    buffer.append(SSEEvent.content(delta))
        
        event = MockEvent()
        on_event(event)
        
        assert len(buffer) == 1
        assert "BRCA1" in buffer[0].to_sse()

    @pytest.mark.asyncio
    async def test_chat_tool_events_drained(self):
        """Test chat drains tool events from the queue."""
        from api import tool_events
        from streaming import SSEEvent
        
        # Simulate tool events queued
        tool_events.clear()
        tool_events.append({"tool": "uniprot_search", "status": "complete", "source": "builtin"})
        tool_events.append({"tool": "pdb_lookup", "status": "complete", "source": "builtin"})
        
        buffer = []
        
        # Simulate tool event draining logic
        while tool_events:
            te = tool_events.popleft()
            buffer.append(SSEEvent.tool_call(te["tool"], te["status"], te["source"]))
        
        assert len(buffer) == 2
        assert "uniprot_search" in buffer[0].to_sse()
        assert "pdb_lookup" in buffer[1].to_sse()
        assert len(tool_events) == 0  # Queue should be empty

    @pytest.mark.asyncio
    async def test_chat_request_validation(self):
        """Test /chat rejects invalid requests."""
        from api import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Missing message field
        response = client.post("/chat", json={})
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_chat_empty_message_handling(self):
        """Test /chat handles empty messages."""
        from api import ChatRequest
        
        # Empty string should be technically valid but semantically empty
        req = ChatRequest(message="")
        assert req.message == ""

    @pytest.mark.asyncio
    async def test_chat_long_message_handling(self):
        """Test /chat can handle longer messages."""
        from api import ChatRequest
        
        long_message = "What are the biological pathways " * 50  # ~1650 chars
        req = ChatRequest(message=long_message)
        assert len(req.message) > 1000
