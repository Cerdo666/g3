import { useState, useEffect, useRef } from 'react';
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
import { Send, Menu, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';

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


type ExportFormat = 'csv' | 'doc' | 'pdf' | 'xlsx';
type ExportAsset = {
  filename: string;
  format: ExportFormat;
  payload: string;
  preview: string;
};

const detectExportFormat = (text: string): ExportFormat | null => {
  const lower = text.toLowerCase();
  if (!/(export|exportable|descargar|archivo)/.test(lower)) return null;
  if (lower.includes('xlsx') || lower.includes('xls') || lower.includes('excel') || lower.includes('hoja de cálculo')) return 'xlsx';
  if (lower.includes('csv')) return 'csv';
  if (lower.includes('word') || lower.includes('doc')) return 'doc';
  if (lower.includes('pdf')) return 'pdf';
  return null;
};

const isExportRequest = (text: string): boolean => /(export|exportable|descargar|archivo)/.test(text.toLowerCase());

const requestsUnsupportedExport = (text: string): boolean => /(ppt|powerpoint|pptx)/.test(text.toLowerCase());

const downloadResponse = (format: ExportFormat, content: string) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const baseName = `oncoquery-export-${timestamp}`;
  const payload = format === 'csv'
    ? `section,text\nresponse,"${content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    : content;
  const mime = format === 'csv'
    ? 'text/csv;charset=utf-8'
    : format === 'pdf'
      ? 'application/pdf'
      : format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/msword';
  const ext = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'doc';
  const blob = new Blob([payload], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

const extractExportPayload = (format: ExportFormat, content: string): string => {
  if (format === 'csv') {
    const csvBlock = content.match(/```csv\s*([\s\S]*?)```/i);
    if (csvBlock?.[1]) return csvBlock[1].trim();

    const genericBlock = content.match(/```([\s\S]*?)```/);
    if (genericBlock?.[1] && genericBlock[1].includes(',')) return genericBlock[1].trim();

    const tableLines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('|') && line.endsWith('|'));

    if (tableLines.length >= 2) {
      return tableLines
        .filter(line => !/^(\|\s*[-:]+\s*)+\|$/.test(line.replace(/\s+/g, '')))
        .map(line =>
          line
            .slice(1, -1)
            .split('|')
            .map(cell => `"${cell.trim().replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
    }
  }

  return content.trim();
};

const buildExportPreview = (format: ExportFormat, payload: string): string => {
  if (format === 'doc' || format === 'xlsx') {
    return payload
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[a-z]*/gi, '').replace(/```/g, ''))
      .replace(/\|/g, ' | ')
      .trim();
  }
  return payload.slice(0, 250);
};

const looksLikeExportConfirmation = (content: string): boolean => {
  const normalized = content.toLowerCase();
  return (
    normalized.includes('acabo de crear') ||
    normalized.includes('archivo') ||
    normalized.includes('carpeta de sesión') ||
    normalized.includes('how to access') ||
    normalized.includes('cómo acceder')
  );
};

export default function App() {
  const { isAuthenticated, userEmail, userName, userId, userRole, accessToken, logout, restoreSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [exportAsset, setExportAsset] = useState<ExportAsset | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_INPUT_ROWS = 5;
  const LINE_HEIGHT_PX = 24;

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = MAX_INPUT_ROWS * LINE_HEIGHT_PX;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

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

  useEffect(() => {
    resizeTextarea(inputRef.current);
  }, [input]);

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

  const handleOpenSignIn = () => navigate('/login');

  const handleOpenRegister = () => navigate('/logup');

  const handleOpenProjects = () => setShowProjects(true);
  const handleOpenHistory = () => navigate('/history');
  const handleOpenAdmin = () => setShowAdmin(true);

  const handleOpenPrivacy = () => navigate('/privacy-policy');
  const handleOpenTerms = () => navigate('/terms');

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
    const previousAssistantMessage = [...messages].reverse().find((m) => m.type === 'ai' && m.content)?.content || '';
    const exportRequested = isExportRequest(userContent);
    const userMsg = { type: 'user', content: userContent };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage(sessionId, 'user', userContent);

    let aiContent = '';
    let aiToolCalls: any[] = [];
    const exportFormat = detectExportFormat(userContent);

    if (requestsUnsupportedExport(userContent)) {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Por ahora no exporto archivos .ppt/.pptx. Puedo exportar en .doc, .xlsx, .csv o .pdf.'
      }]);
      setIsLoading(false);
      return;
    }

    if (exportRequested && !exportFormat) {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: '¿Qué formato exportable deseas exactamente? Indica uno: .doc, .xlsx, .csv o .pdf.'
      }]);
      setIsLoading(false);
      return;
    }

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
      if (exportFormat && aiContent) {
        const currentPayload = extractExportPayload(exportFormat, aiContent);
        const fallbackPayload = previousAssistantMessage ? extractExportPayload(exportFormat, previousAssistantMessage) : '';
        const payload = looksLikeExportConfirmation(currentPayload) && fallbackPayload ? fallbackPayload : currentPayload;
        const timestamp = new Date().toISOString().slice(0, 10);
        setExportAsset({
          format: exportFormat,
          filename: `oncoquery-export-${timestamp}.${exportFormat}`,
          payload,
          preview: buildExportPreview(exportFormat, payload),
        });
      }
      setIsLoading(false);
    }
  };

  // ==================== RENDER MODALES ====================
  if (location.pathname === '/login') {
    if (isAuthenticated) return <Navigate to="/chat" replace />;
    return (
      <SignIn 
        apiUrl={API_URL}
        onCancel={() => navigate('/')}
        onSwitchToRegister={() => navigate('/logup')}
        onForgotPassword={() => { navigate('/login'); setShowForgotPassword(true); }}
      />
    );
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => { setShowForgotPassword(false); setShowSignIn(true); }} />;
  }

  if (location.pathname === '/logup') {
    if (isAuthenticated) return <Navigate to="/chat" replace />;
    return (
      <Register 
        apiUrl={API_URL}
        onCancel={() => navigate('/')}
        onSwitchToSignIn={() => navigate('/login')}
      />
    );
  }

  if (showAdmin && userRole === 'admin') {
    return <AdminPanel userId={userId} onClose={() => setShowAdmin(false)} apiUrl={API_URL} />;
  }

  if (showProjects) {
    return <Projects onClose={() => setShowProjects(false)} />;
  }

  if (location.pathname === '/history') {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <History 
      sessions={chatSessions} 
      onClose={() => navigate('/chat')} 
      onLoadSession={loadSessionMessages}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
    />;
  }

  // ←←← NUEVOS MODALES LEGALES ←←←
  if (location.pathname === '/privacy-policy') {
    return <PrivacyPolicy onClose={() => navigate(-1)} />;
  }

  if (location.pathname === '/terms') {
    return <TermsOfService onClose={() => navigate(-1)} />;
  }

  // ==================== RENDER PRINCIPAL ====================
  if (location.pathname === '/') {
    return <Navigate to={isAuthenticated ? '/chat' : '/login'} replace />;
  }

  if (location.pathname === '/chat' && !isAuthenticated) {
    return <Navigate to="/login" replace />;
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
            </div>

            {exportAsset && (
              <div className="mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#662d3a]">
                      {exportAsset.format === 'xlsx' ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{exportAsset.filename}</p>
                      <p className="text-sm text-gray-500">Nombre archivo · {exportAsset.format.toUpperCase()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadResponse(exportAsset.format, exportAsset.payload)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
                {(exportAsset.format === 'doc' || exportAsset.format === 'xlsx') && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {exportAsset.preview}
                  </div>
                )}
              </div>
            )}

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
            <div className="flex items-end gap-3 flex-shrink-0 w-full bg-white border border-gray-300 rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#662d3a] focus-within:border-transparent transition-shadow">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resizeTextarea(e.target);
                }}
                onKeyDown={(e) => {
                  const isModifierEnter = e.ctrlKey || e.metaKey;
                  if (e.key === 'Enter' && isModifierEnter) {
                    e.preventDefault();
                    const target = e.currentTarget;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const updated = `${input.slice(0, start)}\n${input.slice(end)}`;
                    setInput(updated);
                    requestAnimationFrame(() => {
                      resizeTextarea(target);
                      target.selectionStart = target.selectionEnd = start + 1;
                    });
                    return;
                  }

                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    const target = e.currentTarget;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const updated = `${input.slice(0, start)}\n${input.slice(end)}`;
                    setInput(updated);
                    requestAnimationFrame(() => {
                      target.selectionStart = target.selectionEnd = start + 1;
                    });
                  }
                }}
                rows={1}
                placeholder="Ask me anything about breast cancer proteins, variants, trials or recent literature..."
                className="flex-1 py-1 text-sm bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50 resize-none overflow-y-auto leading-6 min-h-[24px] max-h-[120px]"
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
