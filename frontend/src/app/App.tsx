import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import SignIn from './components/SignIn';
import Register from './components/Register';
import { Send } from 'lucide-react';

interface ToolCall {
  name: string;
  status: 'calling' | 'done' | 'error';
  source: string;
}

interface Message {
  type: 'ai' | 'user';
  content: string;
  sources?: string[];
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // ── Chat state ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mcpServers, setMcpServers] = useState<string[]>([]);
  const [selectedMcp, setSelectedMcp] = useState('ALL');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar MCP servers activos al montar
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(data => setMcpServers(data.mcp_servers ?? []))
      .catch(() => setMcpServers([]));
  }, []);

  // ── Auth handlers (sin tocar lógica original) ───────────────────────
  const handleSignIn = (email: string) => { setUserEmail(email); setIsAuthenticated(true); setShowSignIn(false); };
  const handleRegister = (email: string, name: string) => { setUserEmail(email); setUserName(name); setIsAuthenticated(true); setShowRegister(false); };
  const handleSignOut = () => { setIsAuthenticated(false); setUserEmail(''); setUserName(''); };
  const handleOpenSignIn = () => { setShowSignIn(true); setShowRegister(false); };
  const handleOpenRegister = () => { setShowRegister(true); setShowSignIn(false); };

  // ── Enviar mensaje con streaming SSE ───────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Mensaje del usuario
    setMessages(prev => [...prev, { type: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    // Placeholder del bot mientras responde
    setMessages(prev => [...prev, { type: 'ai', content: '', isStreaming: true }]);

    try {
      const prompt = selectedMcp === 'ALL'
        ? text
        : `[Consulta solo ${selectedMcp}] ${text}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let tools: ToolCall[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);

          let event: { type: string; data: string };
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          if (event.type === 'done') break;

          if (event.type === 'tool_call') {
            const tc = JSON.parse(event.data) as { name: string; status: string; source: string };
            const existing = tools.find(t => t.name === tc.name && t.source === tc.source);
            if (existing) {
              existing.status = tc.status as ToolCall['status'];
              tools = [...tools];
            } else {
              tools = [...tools, { name: tc.name, status: tc.status as ToolCall['status'], source: tc.source }];
            }
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                toolCalls: tools,
              };
              return updated;
            });
          }

          if (event.type === 'content') {
            accumulated += event.data;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                type: 'ai',
                content: accumulated,
                isStreaming: true,
                sources: mcpServers,
                toolCalls: tools,
              };
              return updated;
            });
          }
        }
      }

      // Marcar como terminado
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });

    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          type: 'ai',
          content: 'Error al conectar con el servidor. ¿Está corriendo el backend?',
          isStreaming: false,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Render auth screens ─────────────────────────────────────────────
  if (showSignIn) return <SignIn onSignIn={handleSignIn} onCancel={() => setShowSignIn(false)} onSwitchToRegister={handleOpenRegister} />;
  if (showRegister) return <Register onRegister={handleRegister} onCancel={() => setShowRegister(false)} onSwitchToSignIn={handleOpenSignIn} />;

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      <Header
        onSignOut={handleSignOut}
        userEmail={userEmail}
        userName={userName}
        isAuthenticated={isAuthenticated}
        onOpenSignIn={handleOpenSignIn}
        onOpenRegister={handleOpenRegister}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Title y tabs MCP */}
          <div className="border-b border-gray-200 px-6 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
            <h1 className="text-lg sm:text-xl text-[#662d3a] mb-3 sm:mb-4">Cancer Research Assistant</h1>
            <div className="flex gap-2 sm:gap-4 overflow-x-auto">
              {mcpServers.map(name => (
                <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-[#662d3a] font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 sm:py-6 min-h-0 flex flex-col">
            {/* Status bar */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs sm:text-sm flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${mcpServers.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-[#6b7280]">AI Agent</span>
              </div>
              <span className="text-[#6b7280] hidden sm:inline">•</span>
              <span className="text-[#6b7280]">{mcpServers.length} MCP sources active</span>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto mb-6 min-h-0">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-[#6b7280] text-sm">
                  Haz tu primera consulta sobre proteínas, estructuras o literatura científica.
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  type={msg.type}
                  content={msg.content}
                  sources={msg.sources}
                  isStreaming={msg.isStreaming}
                  toolCalls={msg.toolCalls}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0 w-full">
              <select
                value={selectedMcp}
                onChange={e => setSelectedMcp(e.target.value)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors"
              >
                <option value="ALL">ALL</option>
                {mcpServers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask me anything about breast cancer proteins, variants, trials or recent literature..."
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#662d3a] focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-[#662d3a] text-white rounded hover:bg-[#7a3544] transition-colors flex-shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 sm:px-8 py-3 sm:py-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#6b7280]">
              <span>© 2026 OncoQuery. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <button className="hover:text-[#662d3a] transition-colors">Privacy Policy</button>
              <span className="hidden sm:inline">•</span>
              <button className="hover:text-[#662d3a] transition-colors">Terms of Service</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}