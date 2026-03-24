interface ChatMessageProps {
  type: 'ai' | 'user';
  content?: string;
  sources?: string[];   // nombres de MCP servers que respondieron
  isStreaming?: boolean;
}

export default function ChatMessage({ type, content, sources, isStreaming }: ChatMessageProps) {
  if (type === 'ai') {
    return (
      <div className="mb-6">
        <div className="bg-[#f5f5f7] rounded-lg p-4">
          {content && (
            <p className="text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">{content}</p>
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-[#662d3a] animate-pulse ml-1" />
          )}
          {sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
              {sources.map(s => (
                <span key={s} className="px-2 py-0.5 bg-[#662d3a]/10 text-[#662d3a] rounded text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex justify-end">
      <div className="bg-[#662d3a] text-white rounded-lg px-5 py-3 max-w-[80%]">
        {content && <p className="leading-relaxed">{content}</p>}
      </div>
    </div>
  );
}