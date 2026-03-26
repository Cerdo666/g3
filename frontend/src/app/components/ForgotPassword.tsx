import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#662d3a] to-[#8b4f5a] overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <filter id="goo-forgot">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
          <g filter="url(#goo-forgot)" opacity="0.15">
            <circle cx="10%" cy="20%" r="100" fill="#d4b8be" />
            <circle cx="90%" cy="80%" r="120" fill="#dcc5ca" />
            <circle cx="80%" cy="20%" r="80" fill="#b88e98" />
          </g>
        </svg>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-md flex items-center justify-center overflow-hidden">
                <img src={logoImage} alt="OncoQuery Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-bold text-[#662d3a]" style={{ fontFamily: 'Comfortaa' }}>
                OncoQuery
              </h1>
            </div>
            <p className="text-[#6b7280] text-sm">Cancer Research Assistant</p>
          </div>

          {submitted ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Check your inbox</h2>
              <p className="text-sm text-[#6b7280]">
                We've sent a temporary password reset link to{' '}
                <span className="font-medium text-[#662d3a]">{email}</span>.
                Please check your email and follow the instructions.
              </p>
              <button
                onClick={onBack}
                className="mt-4 w-full py-2.5 bg-[#662d3a] text-white font-semibold rounded-lg hover:bg-[#7a3544] transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Request a new password</h2>
                <p className="text-sm text-[#6b7280]">
                  Enter the email address you used to register.
                </p>
                <p className="text-sm text-[#6b7280] mt-1">
                  To recover your password, we will send you a temporary link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#662d3a] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#662d3a] focus:border-transparent transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#662d3a] text-white font-semibold rounded-lg hover:bg-[#7a3544] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <button
                type="button"
                onClick={onBack}
                className="mt-5 flex items-center gap-2 text-sm text-[#662d3a] hover:text-[#7a3544] font-medium transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-white/70">
          <p>© 2026 OncoQuery. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
