interface ChatMessageProps {
  type: 'ai' | 'user';
  content?: string;
}

export default function ChatMessage({ type, content }: ChatMessageProps) {
  if (type === 'ai') {
    return (
      <div className="mb-6">
        <div className="bg-[#f5f5f7] rounded-lg p-4">
          {content && <p className="text-[#1a1a1a] leading-relaxed">{content}</p>}
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
