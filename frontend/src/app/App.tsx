import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import SignIn from './components/SignIn';
import Register from './components/Register';
import Projects from './components/Projects';
import History from './components/History';
import ForgotPassword from './components/ForgotPassword';
import { Send } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSignIn = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setShowSignIn(false);
  };

  const handleRegister = (email: string, name: string) => {
    setUserEmail(email);
    setUserName(name);
    setIsAuthenticated(true);
    setShowRegister(false);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserName('');
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

  if (showSignIn) {
    return (
      <SignIn 
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
        onRegister={handleRegister} 
        onCancel={handleCloseRegister}
        onSwitchToSignIn={handleOpenSignIn}
      />
    );
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
        isAuthenticated={isAuthenticated}
        onOpenSignIn={handleOpenSignIn}
        onOpenRegister={handleOpenRegister}
        onOpenProjects={handleOpenProjects}
        onOpenHistory={handleOpenHistory}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Title and Tabs */}
          <div className="border-b border-gray-200 px-6 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
            <h1 className="text-lg sm:text-xl text-[#662d3a] mb-3 sm:mb-4">Cancer Research Assistant</h1>
            <div className="flex gap-2 sm:gap-4 overflow-x-auto">
              <button className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-[#6b7280] hover:text-[#662d3a] transition-colors whitespace-nowrap">
                MCP1
              </button>
              <button className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-[#6b7280] hover:text-[#662d3a] transition-colors whitespace-nowrap">
                MCP2
              </button>
              <button className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-[#6b7280] hover:text-[#662d3a] transition-colors whitespace-nowrap">
                MCP3
              </button>
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
              <span className="text-[#6b7280]">3 MCP sources active</span>
              <button className="ml-0 sm:ml-auto px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex-shrink-0">
                Export ↓
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-6 min-h-0">
              <ChatMessage type="ai" />
              <ChatMessage type="user" />
              <ChatMessage type="ai" />
              <ChatMessage type="user" />
              <ChatMessage type="ai" />
              <ChatMessage type="user" />
              <ChatMessage type="ai" />
              <ChatMessage type="user" />
              <ChatMessage type="ai" />
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0 w-full">
              <select className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors">
                <option>ALL</option>
                <option>MCP1</option>
                <option>MCP2</option>
                <option>MCP3</option>
              </select>
              <input
                type="text"
                placeholder="Ask me anything about breast cancer proteins, variants, trials or recent literature..."
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#662d3a] focus:border-transparent"
              />
              <button className="p-2 bg-[#662d3a] text-white rounded hover:bg-[#7a3544] transition-colors flex-shrink-0">
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