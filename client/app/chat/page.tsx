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

    // Initialize with cached user profile if present
    const cachedUser = getUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    // Verify token with backend /api/me
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  const displayName =
    user?.first_name || user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user?.username;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-900/60 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
            DM
          </div>
          <span className="font-semibold text-white tracking-tight">DM Messenger</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{displayName}</div>
            <div className="text-xs text-zinc-400">@{user?.username}</div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center">
        <div className="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-lg">
          <div className="w-14 h-14 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            {user?.username.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">
            Welcome, {displayName}!
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Authentication is verified. Your session is active and persists across reloads.
          </p>

          <div className="text-left text-xs bg-zinc-950 rounded-xl p-4 border border-zinc-800/80 space-y-1.5 text-zinc-400">
            <div><span className="text-zinc-500">User ID:</span> {user?.id}</div>
            <div><span className="text-zinc-500">Username:</span> {user?.username}</div>
            <div><span className="text-zinc-500">Status:</span> Active</div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800/80">
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-800 text-zinc-300 font-medium text-xs rounded-lg border border-zinc-700 transition"
            >
              Sign out of {user?.username}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
