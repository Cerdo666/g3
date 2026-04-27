import { useState } from 'react';
import { LogOut, FolderOpen, History, ShieldCheck, AlertCircle, X } from 'lucide-react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface HeaderProps {
  onSignOut?: () => void;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  isAuthenticated?: boolean;
  onOpenSignIn?: () => void;
  onOpenRegister?: () => void;
  onOpenProjects?: () => void;
  onOpenHistory?: () => void;
  onOpenAdmin?: () => void;
  onNewChat?: () => void;
}

export default function Header({ onSignOut, userEmail, userName, userRole, isAuthenticated, onOpenSignIn, onOpenRegister, onOpenProjects, onOpenHistory, onOpenAdmin, onNewChat }: HeaderProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onSignOut?.();
  };
  return (
    <header className="bg-[#662d3a] text-white px-4 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center text-lg font-bold overflow-hidden">
            <img 
              src={logoImage}
              alt="OncoQuery Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold" style={{ fontFamily: 'Comfortaa' }}>OncoQuery</span>
            <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">BETA</span>
          </div>
        </div>
        
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated && (
          <>
            <button
              onClick={onOpenProjects}
              className="px-4 py-1.5 border border-white rounded hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </button>
            <button
              onClick={onOpenHistory}
              className="px-4 py-1.5 border border-white rounded hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={onNewChat}
              className="px-4 py-1.5 border border-white rounded hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <span className="hidden sm:inline">+ New Chat</span>
              <span className="sm:hidden">+</span>
            </button>
            {userRole === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="px-4 py-1.5 border border-yellow-300 text-yellow-200 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </>
        )}
        {isAuthenticated && userEmail && (
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm text-white/90">{userName || userEmail}</span>
            <span className="text-xs text-white/70">Signed in</span>
          </div>
        )}
        {isAuthenticated ? (
          <button 
            onClick={handleLogoutClick}
            className="px-4 py-1.5 border border-white rounded hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        ) : (
          <>
            <button 
              onClick={onOpenSignIn}
              className="px-4 py-1.5 border border-white rounded hover:bg-white/10 transition-colors"
            >
              Sign in
            </button>
            <button 
              onClick={onOpenRegister}
              className="px-4 py-1.5 border border-white rounded hover:bg-white/10 transition-colors"
            >
              Sign up
            </button>
          </>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm mx-4">
            {/* Close button */}
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>

            {/* Alert icon */}
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <h2 className="text-xl font-bold text-gray-900">Sign Out?</h2>
            </div>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              Are you sure you want to sign out? Your chat session will be closed.
            </p>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
