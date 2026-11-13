'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { clearAuth, getUser, isAuthenticated, setAuth } from '@/lib/auth';
import { UserProfile } from '@/lib/types';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const cachedUser = getUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    api.getMe()
      .then((freshUser) => {
        setUser(freshUser);
        const token = localStorage.getItem('dm_auth_token');
        if (token) setAuth(token, freshUser);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
          router.replace('/login');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-slate-400">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Connecting session...</span>
        </div>
      </div>
    );
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'DM';
  const displayName =
    user?.first_name || user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user?.username;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0e131f]/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center font-bold text-[11px] text-white">
            DM
          </div>
          <span className="font-medium text-sm text-white tracking-tight">DM Messenger</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-3 py-1 pr-1.5 rounded-full bg-[#121826] border border-slate-800">
            <span className="text-xs text-slate-300 font-medium">@{user?.username}</span>
            <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-semibold text-[11px] flex items-center justify-center border border-blue-500/30">
              {initials}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-semibold text-lg flex items-center justify-center mx-auto mb-4">
            {initials}
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Signed in as {displayName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Your credentials and session are verified. Realtime conversations and profiles unlock in the next steps.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#121826] hover:bg-[#182032] border border-slate-800 rounded-md transition-colors"
            >
              Sign out of account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
