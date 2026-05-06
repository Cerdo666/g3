import { History as HistoryIcon, X, MessageSquare, Clock, Trash2, Edit2, Check } from 'lucide-react';
import { useState } from 'react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface HistoryProps {
  sessions: any[];
  onClose: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export default function History({ sessions, onClose, onLoadSession, onDeleteSession, onRenameSession }: HistoryProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const handleStartEdit = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle);
    }
    setEditingSessionId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      onDeleteSession(sessionId);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    onLoadSession(sessionId);
    onClose();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="bg-[#662d3a] text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* OncoQuery branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-md flex items-center justify-center overflow-hidden">
              <img src={logoImage} alt="OncoQuery Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ fontFamily: 'Comfortaa' }}>OncoQuery</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">BETA</span>
            </div>
          </div>
          {/* Divider + page label */}
          <div className="w-px h-6 bg-white/30 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 opacity-80" />
            <span className="text-sm font-medium opacity-90">History</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#662d3a]">Session History</h2>
          {sessions.length > 0 && (
            <span className="text-xs text-gray-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {sessions.length === 0 ? (
          <p className="text-gray-400 text-sm mt-10 text-center">No sessions yet. Start a conversation to see history here.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map(session => (
              <li
                key={session.session_id}
                onClick={() => handleSessionSelect(session.session_id)}
                className="flex items-start justify-between border border-gray-200 rounded-lg px-5 py-4 hover:border-[#662d3a]/40 hover:bg-[#662d3a]/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-[#662d3a]/10 rounded-md flex items-center justify-center text-[#662d3a] flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingSessionId === session.session_id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            handleSaveEdit(session.session_id);
                          } else if (e.key === 'Escape') {
                            setEditingSessionId(null);
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-[#662d3a]/30 rounded text-sm font-medium text-gray-800 focus:outline-none focus:border-[#662d3a]"
                      />
                    ) : (
                      <p className="font-medium text-gray-800 truncate">{session.title}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {formatDate(session.updated_at)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageSquare className="w-3 h-3" /> {session.message_count} messages
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingSessionId === session.session_id ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(session.session_id); }}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      aria-label="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleStartEdit(e, session.session_id, session.title)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      aria-label="Edit session"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteClick(e, session.session_id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
