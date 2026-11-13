'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { setAuth, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/chat');
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await api.login({ username: username.trim(), password });
      setAuth(response.token, response.user);
      router.push('/chat');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to sign in. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F5F5F0] text-[#202734]">
      <div className="w-full max-w-[380px] bg-white border border-[#202734]/10 rounded-2xl p-8 shadow-[0_2px_12px_rgba(32,39,52,0.04)]">
        {/* Brand identity header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-[#5D866C] flex items-center justify-center font-bold text-xs text-[#F5F5F0] tracking-tight shadow-sm shadow-[#5D866C]/20">
              DM
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#202734]">DM Messenger</span>
            <span className="inline-flex items-center gap-1.5 ml-auto text-[11px] text-[#202734]/60 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5D866C]" />
              online
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[#202734] tracking-tight">Sign in</h1>
          <p className="text-xs text-[#202734]/60 mt-1">Enter your credentials to access your conversations</p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-xs leading-relaxed"
          >
            {error}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-[#202734]/80 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex"
              className="w-full px-3 py-2 bg-[#F5F5F0]/60 border border-[#202734]/15 rounded-lg text-[#202734] text-sm placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-2 focus:ring-[#5D866C]/15 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#202734]/80 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#F5F5F0]/60 border border-[#202734]/15 rounded-lg text-[#202734] text-sm placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-2 focus:ring-[#5D866C]/15 transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 px-4 bg-[#5D866C] hover:bg-[#4d705a] active:bg-[#41604c] disabled:opacity-50 text-[#F5F5F0] font-medium text-sm rounded-lg transition shadow-xs"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#202734]/10 text-center">
          <p className="text-xs text-[#202734]/60">
            No account yet?{' '}
            <Link
              href="/signup"
              className="text-[#5D866C] hover:text-[#4d705a] font-medium underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
