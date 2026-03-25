import json
from enum import Enum


class SSEEventType(str, Enum):
    CONTENT = "content"
    TOOL_CALL = "tool_call"
    ERROR = "error"
    DONE = "done"


class SSEEvent:
    """Structured SSE event for streaming responses."""

    def __init__(self, type: SSEEventType, data: str = ""):
        self.type = type
        self.data = data

    def to_sse(self) -> str:
        payload = json.dumps({"type": self.type.value, "data": self.data})
        return f"data: {payload}\n\n"

    @staticmethod
    def content(text: str) -> "SSEEvent":
        return SSEEvent(SSEEventType.CONTENT, text)

    @staticmethod
    def done() -> "SSEEvent":
        return SSEEvent(SSEEventType.DONE)

    @staticmethod
    def error(message: str) -> "SSEEvent":
        return SSEEvent(SSEEventType.ERROR, message)

    @staticmethod
    def tool_call(name: str, status: str = "calling", source: str = "builtin") -> "SSEEvent":
        return SSEEvent(SSEEventType.TOOL_CALL, json.dumps({"name": name, "status": status, "source": source}))
