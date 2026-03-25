import { LogOut } from 'lucide-react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface HeaderProps {
  onSignOut?: () => void;
  userEmail?: string;
  userName?: string;
  isAuthenticated?: boolean;
  onOpenSignIn?: () => void;
  onOpenRegister?: () => void;
}

export default function Header({ onSignOut, userEmail, userName, isAuthenticated, onOpenSignIn, onOpenRegister }: HeaderProps) {
  return (
    <header className="bg-[#662d3a] text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center text-lg font-bold overflow-hidden">
            <img 
              src={logoImage}
              alt="OncoQuery Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ fontFamily: 'Comfortaa' }}>OncoQuery</span>
            <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">BETA</span>
          </div>
        </div>
        
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated && userEmail && (
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm text-white/90">{userName || userEmail}</span>
            <span className="text-xs text-white/70">Signed in</span>
          </div>
        )}
        {isAuthenticated ? (
          <button 
            onClick={onSignOut}
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
    </header>
  );
}
