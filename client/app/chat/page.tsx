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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] text-[#202734]/60">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#5D866C] animate-pulse" />
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
    <div className="min-h-screen bg-[#F5F5F0] text-[#202734] flex flex-col">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-[#202734]/10 px-6 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#5D866C] flex items-center justify-center font-bold text-[11px] text-[#F5F5F0] shadow-xs">
            DM
          </div>
          <span className="font-semibold text-sm text-[#202734] tracking-tight">DM Messenger</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-3 py-1 pr-1.5 rounded-full bg-white border border-[#202734]/10 shadow-2xs">
            <span className="text-xs text-[#202734] font-medium">@{user?.username}</span>
            <div className="w-6 h-6 rounded-full bg-[#5D866C]/15 text-[#5D866C] font-semibold text-[11px] flex items-center justify-center border border-[#5D866C]/25">
              {initials}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[#202734]/60 hover:text-[#202734] px-2.5 py-1.5 rounded-md hover:bg-black/5 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border border-[#202734]/10 rounded-2xl p-8 text-center shadow-[0_2px_12px_rgba(32,39,52,0.04)]">
          <div className="w-14 h-14 rounded-2xl bg-[#5D866C]/12 border border-[#5D866C]/20 text-[#5D866C] font-semibold text-lg flex items-center justify-center mx-auto mb-4">
            {initials}
          </div>
          <h2 className="text-lg font-semibold text-[#202734] tracking-tight">
            Signed in as {displayName}
          </h2>
          <p className="text-xs text-[#202734]/60 mt-1 max-w-xs mx-auto leading-relaxed">
            Your credentials and session are verified. Realtime conversations and profiles unlock in the next steps.
          </p>

          <div className="mt-6 pt-6 border-t border-[#202734]/10">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-xs font-medium text-[#202734] hover:bg-[#F5F5F0] bg-white border border-[#202734]/15 rounded-lg transition"
            >
              Sign out of account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
