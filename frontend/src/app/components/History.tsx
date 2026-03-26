import { History as HistoryIcon, X, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface Session {
  id: number;
  title: string;
  preview: string;
  date: string;
  messages: number;
}

interface HistoryProps {
  onClose: () => void;
}

export default function History({ onClose }: HistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 1,
      title: 'BRCA1 Variant Analysis',
      preview: 'What are the known pathogenic variants in BRCA1 associated with hereditary breast cancer?',
      date: '2026-03-25',
      messages: 14,
    },
    {
      id: 2,
      title: 'PD-L1 Expression & Immunotherapy',
      preview: 'How does PD-L1 expression correlate with response to pembrolizumab in NSCLC?',
      date: '2026-03-24',
      messages: 9,
    },
    {
      id: 3,
      title: 'TP53 Mutation Prevalence',
      preview: 'Summarise TP53 mutation rates across colorectal cancer subtypes from TCGA data.',
      date: '2026-03-22',
      messages: 21,
    },
    {
      id: 4,
      title: 'HER2 Amplification Trials',
      preview: 'List current Phase III clinical trials targeting HER2-amplified gastric cancer.',
      date: '2026-03-20',
      messages: 6,
    },
    {
      id: 5,
      title: 'KRAS G12C Inhibitors',
      preview: 'Compare sotorasib and adagrasib efficacy in KRAS G12C-mutant lung adenocarcinoma.',
      date: '2026-03-18',
      messages: 17,
    },
    {
      id: 6,
      title: 'Tumour Microenvironment Overview',
      preview: 'Explain the role of CAFs in promoting treatment resistance in pancreatic ductal adenocarcinoma.',
      date: '2026-03-15',
      messages: 11,
    },
  ]);

  const handleDelete = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
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
                key={session.id}
                className="flex items-start justify-between border border-gray-200 rounded-lg px-5 py-4 hover:border-[#662d3a]/40 hover:bg-[#662d3a]/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-8 h-8 bg-[#662d3a]/10 rounded-md flex items-center justify-center text-[#662d3a] flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{session.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{session.preview}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {session.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageSquare className="w-3 h-3" /> {session.messages} messages
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(session.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-3"
                  aria-label="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
