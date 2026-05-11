import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { KopiKabinLogo } from '../components/KopiKabinLogo';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export const Login = ({ type }: { type: 'admin' | 'kurir' }) => {
  const { user, userData, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Tracks that Supabase auth actually succeeded (prevents premature "failed" error)
  const [authSucceeded, setAuthSucceeded] = useState(false);

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Always wait for loading to finish — this covers both:
    // (a) initial page load, and (b) the profile fetch after successful login
    if (loading) return;

    // Only run login-result checks once auth has actually succeeded
    if (!authSucceeded) return;

    // Auth succeeded + profile fetch done → check result
    if (!user || !userData) {
      // Profile missing or fetch failed
      setError('Login failed: account not found or inactive. Contact administrator.');
      setIsLoggingIn(false);
      setAuthSucceeded(false);
      signOut();
      return;
    }

    if (userData.status !== 'active') {
      setError('Account inactive. Contact administrator.');
      setIsLoggingIn(false);
      setAuthSucceeded(false);
      signOut();
    } else if (type === 'admin') {
      if (userData.role === 'admin') navigate('/admin');
      else { setError('Access Denied: admin privileges required.'); setIsLoggingIn(false); setAuthSucceeded(false); signOut(); }
    } else {
      if (userData.role === 'kurir' || userData.role === 'admin') navigate('/kurir');
      else { setError('Access Denied: kurir access required.'); setIsLoggingIn(false); setAuthSucceeded(false); signOut(); }
    }
  }, [user, userData, loading, authSucceeded, navigate, type, signOut]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    setAuthSucceeded(false);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Supabase returns "Invalid login credentials" for wrong email/password
      setError(signInError.message ?? 'Invalid credentials');
      setIsLoggingIn(false);
    } else {
      // Auth passed — mark it so the useEffect waits for the profile fetch to finish
      setAuthSucceeded(true);
    }
  };

  if (isLoggingIn) {
    return (
      <div className={`min-h-screen ${type === 'admin' ? 'bg-[#003B73]' : 'bg-[#FDC500]'} flex items-center justify-center`}>
        <Loader2 className={`w-12 h-12 ${type === 'admin' ? 'text-white' : 'text-[#003B73]'} animate-spin`} />
      </div>
    );
  }

  const shadowClass = type === 'admin'
    ? 'shadow-[8px_8px_0px_#FDC500] sm:shadow-[12px_12px_0px_#FDC500]'
    : 'shadow-[8px_8px_0px_#003B73] sm:shadow-[12px_12px_0px_#003B73]';

  return (
    <div className={`min-h-screen ${type === 'admin' ? 'bg-[#003B73]' : 'bg-[#FDC500]'} flex flex-col items-center justify-center p-4`}>
      <div className={`w-full max-w-sm sm:max-w-md bg-white border-[4px] sm:border-[6px] border-black p-6 sm:p-8 text-black ${shadowClass} relative transform hover:-translate-y-1 transition-transform mt-8`}>
        <div className={`absolute -top-10 sm:-top-12 left-1/2 -ml-12 sm:-left-4 sm:ml-0 w-20 h-20 sm:w-24 sm:h-24 ${type === 'admin' ? 'bg-[#FDC500]' : 'bg-white'} border-[4px] border-black rounded-full flex items-center justify-center`}>
          <KopiKabinLogo className={`w-10 h-10 sm:w-12 sm:h-12 ${type === 'kurir' ? 'text-[#003B73]' : ''}`} />
        </div>

        <div className="mt-8 sm:mt-8 mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black uppercase mb-1 sm:mb-2 text-[#003B73] leading-none">
            {type === 'admin' ? 'System Login' : 'Kurir Portal'}
          </h1>
          <p className="font-mono text-[10px] sm:text-sm font-bold text-gray-500 tracking-widest uppercase">
            {type === 'admin' ? 'Admin Access Only' : 'Staff Operations'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-[2px] border-red-500 text-red-700 font-mono text-sm font-bold">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 mb-4">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full border-[3px] border-black p-3 outline-none focus:border-[#003B73] font-mono text-sm"
            required
          />
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border-[3px] border-black p-3 pr-11 outline-none focus:border-[#003B73] font-mono text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003B73] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            className={`w-full ${type === 'admin' ? 'bg-[#003B73] text-white hover:text-[#FDC500]' : 'bg-[#FDC500] text-[#003B73] hover:text-white'} font-black uppercase tracking-widest py-4 border-[4px] border-black hover:bg-black transition-colors relative overflow-hidden group`}
          >
            <span className="relative z-10">Sign In</span>
          </button>
        </form>

        <p className="text-center font-mono text-xs text-gray-400 mt-4">Restricted Access // Authorized Personnel Only</p>

      </div>
    </div>
  );
};
