import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface SignInProps {
  onSignIn: (email: string) => void;
  onCancel?: () => void;
  onSwitchToRegister?: () => void;
}

export default function SignIn({ onSignIn, onCancel, onSwitchToRegister }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    // Simulate sign in
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSignIn(email);
    }, 1000);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#662d3a] to-[#8b4f5a] overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <filter id="goo-signin">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
          <g filter="url(#goo-signin)" opacity="0.15">
            <circle cx="10%" cy="20%" r="100" fill="#d4b8be" />
            <circle cx="90%" cy="80%" r="120" fill="#dcc5ca" />
            <circle cx="80%" cy="20%" r="80" fill="#b88e98" />
          </g>
        </svg>
      </div>

      {/* Sign In Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-10">
          {/* Close Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center text-lg font-bold overflow-hidden">
                          <img 
                            src={logoImage}
                            alt="OncoQuery Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
              <h1 className="text-3xl font-bold text-[#662d3a]" style={{ fontFamily: 'Comfortaa' }}>
                OncoQuery
              </h1>
            </div>
            <p className="text-[#6b7280] text-sm">Cancer Research Assistant</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-[#662d3a] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#662d3a] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-[#662d3a] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#662d3a] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] hover:text-[#662d3a] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded accent-[#662d3a]"
                />
                <span className="text-[#6b7280]">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[#662d3a] hover:text-[#7a3544] font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#662d3a] text-white font-semibold rounded-lg hover:bg-[#7a3544] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-[#6b7280]">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[#6b7280]">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#662d3a] hover:text-[#7a3544] font-semibold transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/70">
          <p>© 2026 OncoQuery. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
