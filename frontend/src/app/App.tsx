import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
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
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { Send, Menu } from 'lucide-react';

// ── Hybrid API URL Detection ──────────────────────────────────────────
const API_URL = (() => {
  // Use environment variable if set
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Auto-detect based on hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  
  // Default to same host (for production with reverse proxy)
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}`;
})();

export default function App() {
  const { isAuthenticated, userEmail, userName, userId, userRole, accessToken, setAuth, logout, restoreSession } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mcpServers, setMcpServers] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);

  // Load sessions from database
  const loadChatSessions = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.ok) {
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load messages from a specific session
  const loadSessionMessages = async (sessionId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chat/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.ok) {
        setCurrentSessionId(sessionId);
        sessionStorage.setItem('currentSessionId', sessionId);
        setMessages(data.messages.map((msg: any) => ({
          type: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content,
        })));
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // Start a new chat session
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
    sessionStorage.removeItem('currentSessionId');
    loadChatSessions();
  };

  // Delete a chat session
  const handleDeleteSession = async (sessionId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chat/session/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        // If deleting current session, clear it
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
          setMessages([]);
          sessionStorage.removeItem('currentSessionId');
        }
        // Reload sessions list
        loadChatSessions();
      } else {
        console.error('Failed to delete session:', res.status);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Rename a chat session
  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/chat/session/${sessionId}/rename?title=${encodeURIComponent(newTitle)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        loadChatSessions();
      } else {
        console.error('Failed to rename session:', res.status);
      }
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  // Restore session and load MCP servers on mount
  useEffect(() => {
    restoreSession();
    
    fetch(`${API_URL}/status`)
      .then(r => r.json())
      .then(data => setMcpServers(data.mcp_servers ?? []))
      .catch(() => setMcpServers([]));
  }, [restoreSession]);

  // Restore current session from sessionStorage when user is authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const savedSessionId = sessionStorage.getItem('currentSessionId');
      if (savedSessionId && !currentSessionId) {
        loadSessionMessages(savedSessionId);
      }
    }
  }, [isAuthenticated, accessToken]);

  // Load chat sessions when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadChatSessions();
    }
  }, [isAuthenticated, accessToken]);

  // Save current session ID to sessionStorage when it changes
  useEffect(() => {
    if (currentSessionId) {
      sessionStorage.setItem('currentSessionId', currentSessionId);
    }
  }, [currentSessionId]);

  // Close auth modals when user successfully logs in
  useEffect(() => {
    if (isAuthenticated) {
      setShowSignIn(false);
      setShowRegister(false);
    }
  }, [isAuthenticated]);

  const handleSignOut = () => {
    logout();
    setMessages([]);
  };

  const handleOpenSignIn = () => {
    setShowSignIn(true);
    setShowRegister(false);
  };

  const handleOpenRegister = () => {
    setShowRegister(true);
    setShowSignIn(false);
  };

  const handleOpenProjects = () => setShowProjects(true);
  const handleOpenHistory = () => setShowHistory(true);
  const handleOpenAdmin = () => setShowAdmin(true);

  const handleOpenPrivacy = () => setShowPrivacy(true);
  const handleOpenTerms = () => setShowTerms(true);

  const handleQuerySelect = (query: string) => {
    setInput(query);
  };

  // Create a new chat session when user starts chatting
  const createNewSession = async () => {
    if (!currentSessionId && isAuthenticated) {
      try {
        const res = await fetch(`${API_URL}/chat/session/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.ok) {
          setCurrentSessionId(data.session_id);
          return data.session_id;
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }
    return currentSessionId;
  };

  // Save a message to the database
  const saveMessage = async (sessionId: string, role: string, content: string) => {
    if (!sessionId) {
      console.warn('No session ID for saving message');
      return;
    }
    try {
      const url = `${API_URL}/chat/session/${sessionId}/message?role=${role}&content=${encodeURIComponent(content)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const error = await res.text();
        console.error('Failed to save message:', res.status, error);
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Create session if needed
    let sessionId = currentSessionId || (await createNewSession());
    if (!sessionId) return;

    const userContent = input;
    const userMsg = { type: 'user', content: userContent };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage(sessionId, 'user', userContent);

    let aiContent = '';
    let aiToolCalls: any[] = [];

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: userContent }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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
      // Save AI response to database
      if (sessionId && aiContent) {
        await saveMessage(sessionId, 'assistant', aiContent);
      }
      setIsLoading(false);
    }
  };

  // ==================== RENDER MODALES ====================
  if (showSignIn) {
    return (
      <SignIn 
        apiUrl={API_URL}
        onCancel={() => setShowSignIn(false)}
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
        onCancel={() => setShowRegister(false)}
        onSwitchToSignIn={handleOpenSignIn}
      />
    );
  }

  if (showAdmin && userRole === 'admin') {
    return <AdminPanel userId={userId} onClose={() => setShowAdmin(false)} apiUrl={API_URL} />;
  }

  if (showProjects) {
    return <Projects onClose={() => setShowProjects(false)} />;
  }

  if (showHistory) {
    return <History 
      sessions={chatSessions} 
      onClose={() => setShowHistory(false)} 
      onLoadSession={loadSessionMessages}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
    />;
  }

  // ←←← NUEVOS MODALES LEGALES ←←←
  if (showPrivacy) {
    return <PrivacyPolicy onClose={() => setShowPrivacy(false)} />;
  }

  if (showTerms) {
    return <TermsOfService onClose={() => setShowTerms(false)} />;
  }

  // ==================== RENDER PRINCIPAL ====================
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
        onOpenAdmin={handleOpenAdmin}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {sidebarOpen ? (
          <div className="w-80 flex-shrink-0 transition-[width] duration-200 ease-in-out">
            <Sidebar 
              onQuerySelect={handleQuerySelect} 
              onCollapse={() => setSidebarOpen(false)}
              onOpenPrivacy={handleOpenPrivacy}     // ← Nuevo
              onOpenTerms={handleOpenTerms}         // ← Nuevo
            />
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

            {/* Input Bar */}
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