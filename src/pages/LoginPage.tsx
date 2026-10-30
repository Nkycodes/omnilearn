import React, { useState } from 'react';
import { Brain, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { authApi } from '../api/client';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        window.location.href = '/dashboard';
      } else {
        setError(res.error || 'Failed to sign in');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // First try to login demo user; if not exists, register demo user
      try {
        const res = await authApi.login({
          email: 'scholar@omnilearn.ai',
          password: 'password123',
        });
        if (res.success) {
          window.location.href = '/dashboard';
          return;
        }
      } catch {
        // Fallback register demo user
        const regRes = await authApi.register({
          email: 'scholar@omnilearn.ai',
          password: 'password123',
          name: 'Scholar Alex',
        });
        if (regRes.success) {
          window.location.href = '/dashboard';
          return;
        }
      }
    } catch (err: any) {
      setError('Unable to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl mb-4">
            <Brain className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Welcome to <span className="text-indigo-400">OmniLearn</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Synthesize readings, whiteboard diagrams, and lecture audio into cohesive mastery.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Quick Demo Access Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-6 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-indigo-500/40 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Launch Instant Demo Workspace (One-Click)</span>
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            or sign in with email
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Register for free
          </a>
        </p>
      </div>
    </div>
  );
};
