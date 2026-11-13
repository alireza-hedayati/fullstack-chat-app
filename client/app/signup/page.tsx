'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { setAuth, isAuthenticated } from '@/lib/auth';

export default function SignupPage() {
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

    const trimmedUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      setError('Username must be 3–20 characters and contain only letters, numbers, or underscores.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.signup({ username: trimmedUsername, password });
      setAuth(response.token, response.user);
      router.push('/chat');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to create account. Please try again.');
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
          </div>
          <h1 className="text-xl font-semibold text-[#202734] tracking-tight">Create your account</h1>
          <p className="text-xs text-[#202734]/60 mt-1">Start chatting with anyone directly by username</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="username" className="block text-xs font-medium text-[#202734]/80">
                Username
              </label>
              <span className="text-[11px] text-[#202734]/50">3–20 chars, a–z, 0–9, _</span>
            </div>
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-[#202734]/80">
                Password
              </label>
              <span className="text-[11px] text-[#202734]/50">Min 6 characters</span>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
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
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#202734]/10 text-center">
          <p className="text-xs text-[#202734]/60">
            Already registered?{' '}
            <Link
              href="/login"
              className="text-[#5D866C] hover:text-[#4d705a] font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
