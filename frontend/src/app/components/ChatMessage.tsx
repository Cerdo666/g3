import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ToolCall {
  name: string;
  status: 'calling' | 'done' | 'error';
  source: string;
}

interface ChatMessageProps {
  type: 'ai' | 'user';
  content?: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

function ToolCallBadge({ name, status, source }: ToolCall) {
  const colors = {
    calling: 'bg-amber-100 text-amber-800 border-amber-200',
    done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };
  const icons = { calling: '\u23f3', done: '\u2713', error: '\u2717' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono ${colors[status]}`}>
      <span>{icons[status]}</span>
      {source !== 'builtin' && <span className="text-[0.65rem] opacity-60">{source}/</span>}
      {name}
    </span>
  );
}

export default function ChatMessage({ type, content, toolCalls, isStreaming }: ChatMessageProps) {
  if (type === 'ai') {
    return (
      <div className="mb-6">
        <div className="bg-[#f5f5f7] rounded-lg p-4">
          {toolCalls && toolCalls.length > 0 && (
            <div className="mb-3 pb-3 border-b border-gray-200 flex gap-1.5 flex-wrap">
              {toolCalls.map((tc, idx) => (
                <ToolCallBadge key={`${tc.source}-${tc.name}-${idx}`} {...tc} />
              ))}
            </div>
          )}
          {content && (
            <div className="text-[#1a1a1a] leading-relaxed prose prose-sm max-w-none prose-headings:text-[#662d3a] prose-a:text-[#662d3a]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-[#662d3a] animate-pulse ml-1" />
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
