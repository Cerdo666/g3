import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function normalizeStreamingArtifacts(raw: string): string {
  return raw.replace(/([a-zA-Z]+):(?=[A-Z])/g, '$1: ').replace(/\n{3,}/g, '\n\n').trimStart();
}

function splitThinkingSection(content: string): { thinking: string | null; response: string } {
  const normalized = normalizeStreamingArtifacts(content);
  const match = normalized.match(/^(thinking|reasoning)\s*:\s*([\s\S]*?)\n{2,}([\s\S]*)$/i);
  if (!match) return { thinking: null, response: normalized };
  return { thinking: match[2].trim(), response: match[3].trim() };
}

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
  sources?: string[];
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

function ToolCallsSection({ toolCalls }: { toolCalls: ToolCall[] }) {
  const mcpTools = toolCalls.filter(t => t.source && t.source !== 'builtin');
  const builtinTools = toolCalls.filter(t => !t.source || t.source === 'builtin');

  return (
    <div className="mb-3 pb-3 border-b border-gray-200 space-y-2">
      {builtinTools.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-1">Tools</div>
          <div className="flex gap-1.5 flex-wrap">
            {builtinTools.map(tc => (
              <ToolCallBadge key={`builtin-${tc.name}`} {...tc} />
            ))}
          </div>
        </div>
      )}
      {mcpTools.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1.5">MCP invocations</div>
          <div className="flex gap-1.5 flex-wrap">
            {mcpTools.map(tc => (
              <ToolCallBadge key={`${tc.source}-${tc.name}`} {...tc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ type, content, sources, isStreaming, toolCalls }: ChatMessageProps) {
  const parsedContent = content ? splitThinkingSection(content) : { thinking: null, response: '' };

  if (type === 'ai') {
    return (
      <div className="mb-6">
        <div className="bg-[#f5f5f7] rounded-lg p-4">
          {toolCalls && toolCalls.length > 0 && (
            <ToolCallsSection toolCalls={toolCalls} />
          )}
          {parsedContent.thinking && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
              <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700">Thinking</div>
              <p className="mt-1 text-sm text-amber-900 whitespace-pre-wrap">{parsedContent.thinking}</p>
            </div>
          )}
          {parsedContent.response && (
            <div className="text-[#1a1a1a] leading-relaxed prose prose-sm max-w-none prose-headings:text-[#662d3a] prose-a:text-[#662d3a] prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedContent.response}</ReactMarkdown>
            </div>
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
