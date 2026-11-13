'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { clearAuth, getUser, isAuthenticated, setAuth } from '@/lib/auth';
import { ConversationSummary, UserProfile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { getDisplayName } from '@/lib/display';

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const cached = getUser();
    if (cached) setCurrentUser(cached);

    // Fetch fresh user profile and conversations
    Promise.all([api.getMe(), api.getConversations()])
      .then(([freshUser, convList]) => {
        setCurrentUser(freshUser);
        setConversations(convList);
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

  // Live user search handler
  function handleSearchChange(val: string) {
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.searchUsers(val.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
  }

  // Open or create a conversation with target user
  async function handleOpenConversation(username: string) {
    try {
      const conv = await api.createConversation(username);
      setSearchQuery('');
      setSearchResults([]);

      // Update or add conversation in list
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });

      setSelectedConvId(conv.id);
    } catch (err) {
      console.error('Failed to open conversation:', err);
    }
  }

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] text-[#202734]/60">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#5D866C] animate-pulse" />
          <span>Connecting session...</span>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find((c) => c.id === selectedConvId) || null;
  const currentDisplayName = currentUser ? getDisplayName(currentUser) : 'User';

  return (
    <div className="h-screen bg-[#F5F5F0] text-[#202734] flex flex-col overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-[#202734]/10 px-4 sm:px-6 flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#5D866C] flex items-center justify-center font-bold text-[11px] text-[#F5F5F0] shadow-xs">
            DM
          </div>
          <span className="font-semibold text-sm text-[#202734] tracking-tight">DM Messenger</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-3 py-1 pr-1.5 rounded-full bg-white border border-[#202734]/10 hover:border-[#5D866C]/40 transition shadow-2xs group"
          >
            <span className="text-xs text-[#202734] font-medium group-hover:text-[#5D866C] transition-colors">
              {currentDisplayName}
            </span>
            {currentUser && <Avatar user={currentUser} size="sm" />}
          </Link>

          <Link
            href="/profile"
            className="text-xs text-[#202734]/70 hover:text-[#202734] px-2.5 py-1.5 rounded-md hover:bg-black/5 transition font-medium"
          >
            Profile
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs text-[#202734]/60 hover:text-[#202734] px-2.5 py-1.5 rounded-md hover:bg-black/5 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Two-Column Messenger Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Search & Conversations */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-[#202734]/10 bg-white flex flex-col shrink-0 ${
            selectedConvId !== null ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-[#202734]/10 bg-white sticky top-0 z-10">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search username to chat..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F5F5F0] border border-[#202734]/10 rounded-lg text-xs text-[#202734] placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-1 focus:ring-[#5D866C] transition"
              />
              <svg
                className="w-3.5 h-3.5 text-[#202734]/40 absolute left-2.5 top-2.5 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-[#202734]/40 hover:text-[#202734] text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown/Overlay */}
            {searchQuery.trim() !== '' && (
              <div className="mt-2 bg-white border border-[#202734]/10 rounded-xl shadow-lg overflow-hidden divide-y divide-[#202734]/5">
                {searching && (
                  <div className="p-3 text-xs text-[#202734]/50 text-center">Searching...</div>
                )}
                {!searching && searchResults.length === 0 && (
                  <div className="p-3 text-xs text-[#202734]/50 text-center">No users found</div>
                )}
                {!searching &&
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleOpenConversation(user.username)}
                      className="w-full p-2.5 flex items-center gap-2.5 hover:bg-[#F5F5F0] text-left transition"
                    >
                      <Avatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#202734] truncate">
                          {getDisplayName(user)}
                        </div>
                        <div className="text-[11px] text-[#202734]/50 font-mono truncate">
                          @{user.username}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#5D866C] px-2 py-0.5 rounded bg-[#5D866C]/10">
                        Chat
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#202734]/5">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[#202734]/50 text-xs leading-relaxed">
                <div className="w-9 h-9 rounded-full bg-[#202734]/5 flex items-center justify-center mx-auto mb-2 text-[#202734]/40">
                  💬
                </div>
                No conversations yet.<br />Search for a username above to start chatting.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === selectedConvId;
                const peerName = getDisplayName(conv.peer);
                const lastText = conv.last_message?.content || 'No messages yet';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-3 flex items-center gap-3 text-left transition border-l-2 ${
                      isActive
                        ? 'bg-[#5D866C]/10 border-[#5D866C]'
                        : 'border-transparent hover:bg-[#F5F5F0]/80'
                    }`}
                  >
                    <Avatar user={conv.peer} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-[#202734] truncate">
                          {peerName}
                        </span>
                        {conv.last_message && (
                          <span className="text-[10px] text-[#202734]/40 shrink-0">
                            {conv.last_message.created_at.slice(11, 16)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#202734]/60 truncate">
                        {lastText}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Selected Conversation or Empty State */}
        <main
          className={`flex-1 bg-[#F5F5F0] flex flex-col overflow-hidden ${
            selectedConvId === null ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              {/* Conversation Header */}
              <div className="h-14 border-b border-[#202734]/10 bg-white/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden text-xs text-[#202734]/70 p-1.5 rounded-md hover:bg-black/5"
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>
                  <Avatar user={selectedConversation.peer} size="sm" />
                  <div>
                    <h2 className="text-xs font-semibold text-[#202734]">
                      {getDisplayName(selectedConversation.peer)}
                    </h2>
                    <span className="text-[11px] text-[#202734]/50 font-mono">
                      @{selectedConversation.peer.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Pane Area (Empty State for F3) */}
              <div className="flex-1 p-6 flex flex-col justify-center items-center text-center overflow-y-auto">
                <div className="max-w-sm">
                  <Avatar user={selectedConversation.peer} size="xl" className="mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-[#202734]">
                    {getDisplayName(selectedConversation.peer)}
                  </h3>
                  <p className="text-xs text-[#202734]/50 font-mono mt-0.5">
                    @{selectedConversation.peer.username}
                  </p>
                  {selectedConversation.peer.bio && (
                    <p className="text-xs text-[#202734]/70 mt-2 px-3 py-1.5 bg-white border border-[#202734]/10 rounded-lg italic">
                      &ldquo;{selectedConversation.peer.bio}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-[#202734]/60 mt-4 leading-relaxed">
                    This conversation is open. Instant realtime messaging will connect in F4.
                  </p>
                </div>
              </div>

              {/* Message Input Footer (Disabled in F3, ready for F4) */}
              <div className="p-4 bg-white border-t border-[#202734]/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Type a message (realtime messaging connects in F4)..."
                    className="flex-1 px-3.5 py-2 bg-[#F5F5F0]/60 border border-[#202734]/10 rounded-lg text-xs text-[#202734]/60 cursor-not-allowed"
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-[#5D866C]/50 text-[#F5F5F0] text-xs font-medium rounded-lg cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center p-6 text-center text-[#202734]/50">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#202734]/10 flex items-center justify-center text-xl mb-3 shadow-2xs">
                ✉
              </div>
              <h3 className="text-sm font-semibold text-[#202734]">No conversation selected</h3>
              <p className="text-xs text-[#202734]/60 mt-1 max-w-xs">
                Pick a conversation from the sidebar or search for someone by username to start chatting.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
