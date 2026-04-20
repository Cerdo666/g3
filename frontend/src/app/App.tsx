import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BubbleAnimation from './components/BubbleAnimation';
import ChatMessage from './components/ChatMessage';
import SignIn from './components/SignIn';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import Projects from './components/Projects';
import History from './components/History';
import ForgotPassword from './components/ForgotPassword';
import { Send, Menu } from 'lucide-react';


const API_URL = 'https://app-123.jollysky-7e15a62c.spaincentral.azurecontainerapps.io';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mcpServers, setMcpServers] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load MCP servers from backend
  useEffect(() => {
  fetch(`${API_URL}/status`)
      .then(r => r.json())
      .then(data => setMcpServers(data.mcp_servers ?? []))
      .catch(() => setMcpServers([]));
  }, []);

  const handleSignIn = (email: string, name: string, role?: string, id?: string) => {
    setUserEmail(email);
    setUserName(name);
    setUserRole(role || 'user');
    setUserId(id || '');
    setIsAuthenticated(true);
    setShowSignIn(false);
  };

  const handleRegister = (email: string, name: string, role?: string, id?: string) => {
    setUserEmail(email);
    setUserName(name);
    setUserRole(role || 'user');
    setUserId(id || '');
    setIsAuthenticated(true);
    setShowRegister(false);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserName('');
    setUserId('');
    setUserRole('');
  };

  const handleOpenSignIn = () => {
    setShowSignIn(true);
    setShowRegister(false);
  };

  const handleOpenRegister = () => {
    setShowRegister(true);
    setShowSignIn(false);
  };

  const handleOpenProjects = () => {
    setShowProjects(true);
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
  };

  const handleCloseSignIn = () => {
    setShowSignIn(false);
  };

  const handleCloseRegister = () => {
    setShowRegister(false);
  };

  const handleQuerySelect = (query: string) => {
    setInput(query);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { type: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      let aiToolCalls: any[] = [];

      const aiMsg = { type: 'ai', content: '', toolCalls: [] };
      setMessages(prev => [...prev, aiMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content' && data.data) {
                  aiContent += data.data;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { type: 'ai', content: aiContent, toolCalls: aiToolCalls };
                    return updated;
                  });
                } else if (data.type === 'tool_call' && data.data) {
                  const tc = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                  // Update existing entry if same tool, else append
                  const idx = aiToolCalls.findIndex(t => t.name === tc.name && t.source === tc.source);
                  if (idx >= 0) {
                    aiToolCalls = [...aiToolCalls];
                    aiToolCalls[idx] = tc;
                  } else {
                    aiToolCalls = [...aiToolCalls, tc];
                  }
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { type: 'ai', content: aiContent, toolCalls: aiToolCalls };
                    return updated;
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
       setMessages(prev => [...prev, { type: 'ai', content: 'Error connecting to backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSignIn) {
    return (
      <SignIn 
        apiUrl={API_URL}
        onSignIn={handleSignIn} 
        onCancel={handleCloseSignIn}
        onSwitchToRegister={handleOpenRegister}
        onForgotPassword={() => { setShowSignIn(false); setShowForgotPassword(true); }}
      />
    );
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => { setShowForgotPassword(false); setShowSignIn(true); }} />;
  }

  if (showRegister) {
    return (
      <Register 
        apiUrl={API_URL}
        onRegister={handleRegister} 
        onCancel={handleCloseRegister}
        onSwitchToSignIn={handleOpenSignIn}
      />
    );
  }

  if (showAdmin && userRole === 'admin') {
    return <AdminPanel userId={userId} onClose={() => setShowAdmin(false)} />;
  }

  if (showProjects) {
    return <Projects onClose={() => setShowProjects(false)} />;
  }

  if (showHistory) {
    return <History onClose={() => setShowHistory(false)} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      <Header 
        onSignOut={handleSignOut} 
        userEmail={userEmail}
        userName={userName}
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        onOpenSignIn={handleOpenSignIn}
        onOpenRegister={handleOpenRegister}
        onOpenProjects={handleOpenProjects}
        onOpenHistory={handleOpenHistory}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {sidebarOpen ? (
          <div className="w-80 flex-shrink-0 transition-[width] duration-200 ease-in-out">
            <Sidebar onQuerySelect={handleQuerySelect} onCollapse={() => setSidebarOpen(false)} />
          </div>
        ) : (
          <div className="w-12 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center relative overflow-hidden">
            <BubbleAnimation />
            <button
              className="relative z-10 mt-3 p-1.5 text-[#662d3a] hover:bg-white/60 rounded transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Title and Tabs */}
          <div className="border-b border-gray-200 px-4 sm:px-8 pt-2 sm:pt-3 pb-2 sm:pb-2.5 flex-shrink-0">
            <h1 className="text-sm sm:text-base text-[#662d3a] mb-1.5 sm:mb-2">Cancer Research Assistant</h1>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto">
              {mcpServers.map(name => (
                <span key={name} className="flex items-center gap-1 px-2 py-0.5 text-[0.7rem] sm:text-xs text-[#662d3a] font-medium">
                  <span className="w-1 h-1 bg-green-500 rounded-full" />
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 sm:py-6 min-h-0 flex flex-col">
            {/* AI Agent Status */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 text-xs sm:text-sm flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-[#6b7280]">AI Agent</span>
              </div>
              <span className="text-[#6b7280] hidden sm:inline">•</span>
              <span className="text-[#6b7280]">{mcpServers.length} MCP sources active</span>
              <button className="ml-0 sm:ml-auto px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex-shrink-0">
                Export ↓
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-6 min-h-0">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="text-gray-400">
                    <p className="text-lg font-semibold mb-2">Welcome to OncoQuery</p>
                    <p className="text-sm">Ask me anything about cancer research, proteins, structures, and more.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    type={msg.type}
                    content={msg.content}
                    toolCalls={msg.toolCalls}
                    isStreaming={isLoading && i === messages.length - 1 && msg.type === 'ai'}
                  />
                ))
              )}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 flex-shrink-0 w-full bg-white border border-gray-300 rounded-full px-4 py-1 shadow-sm focus-within:ring-2 focus-within:ring-[#662d3a] focus-within:border-transparent transition-shadow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything about breast cancer proteins, variants, trials or recent literature..."
                className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-[#662d3a] text-white rounded-full hover:bg-[#7a3544] transition-colors flex-shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>


        </main>
      </div>
    </div>
  );
}