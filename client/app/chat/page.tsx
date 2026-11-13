'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { clearAuth, getToken, getUser, isAuthenticated, setAuth } from '@/lib/auth';
import { ConversationSummary, Message, UserProfile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { getDisplayName } from '@/lib/display';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

function formatMessageTime(utcString: string): string {
  try {
    const iso = utcString.includes('T') ? utcString : utcString.replace(' ', 'T') + 'Z';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return utcString.slice(11, 16);
  }
}

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Conversations & Messages State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Message Send Form State
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Messages Scroll Ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedConvIdRef = useRef<number | null>(null);
  selectedConvIdRef.current = selectedConvId;

  // Initial Auth & Data Fetch
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const token = getToken();
    const cached = getUser();
    if (cached) setCurrentUser(cached);

    if (token) {
      const socket = connectSocket(token);

      // Listen for incoming messages
      socket.on('message:new', (newMsg: Message) => {
        handleIncomingMessage(newMsg);
      });

      // On reconnect, refetch active conversation history per architecture spec
      socket.on('connect', () => {
        if (selectedConvIdRef.current !== null) {
          api.getMessages(selectedConvIdRef.current)
            .then((refetched) => setMessages(refetched))
            .catch(() => {});
        }
      });
    }

    Promise.all([api.getMe(), api.getConversations()])
      .then(([freshUser, convList]) => {
        setCurrentUser(freshUser);
        setConversations(convList);
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

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('message:new');
      }
    };
  }, [router]);

  // Handle incoming message: updates active pane & sidebar
  function handleIncomingMessage(msg: Message) {
    if (selectedConvIdRef.current === msg.conversation_id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }

    // Reorder conversation list and bump to top
    setConversations((prev) => {
      const targetIndex = prev.findIndex((c) => c.id === msg.conversation_id);
      if (targetIndex >= 0) {
        const targetConv = {
          ...prev[targetIndex],
          last_message: msg,
        };
        const rest = prev.filter((_, i) => i !== targetIndex);
        return [targetConv, ...rest];
      }

      // If conversation is unknown to caller, refetch conversation list
      api.getConversations().then((refetched) => setConversations(refetched));
      return prev;
    });
  }

  // Load message history when selecting a conversation
  useEffect(() => {
    if (selectedConvId === null) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setSendError(null);
    api.getMessages(selectedConvId)
      .then((history) => {
        setMessages(history);
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [selectedConvId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || selectedConvId === null || sending) return;

    const content = messageInput.trim();
    setSending(true);
    setSendError(null);

    const socket = getSocket();
    if (!socket || !socket.connected) {
      setSendError('Realtime connection unavailable. Please wait...');
      setSending(false);
      return;
    }

    socket.emit(
      'message:send',
      { conversation_id: selectedConvId, content },
      (ack: { ok: true; message: Message } | { ok: false; error: string }) => {
        setSending(false);
        if (!ack.ok) {
          setSendError(ack.error || 'Failed to send message');
          return;
        }

        setMessageInput('');
        setMessages((prev) => {
          if (prev.some((m) => m.id === ack.message.id)) return prev;
          return [...prev, ack.message];
        });

        // Bump conversation in sidebar
        setConversations((prev) => {
          const targetIndex = prev.findIndex((c) => c.id === selectedConvId);
          if (targetIndex >= 0) {
            const updated = { ...prev[targetIndex], last_message: ack.message };
            const rest = prev.filter((_, i) => i !== targetIndex);
            return [updated, ...rest];
          }
          return prev;
        });
      }
    );
  }

  // Search users handler
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

  // Open or create conversation
  async function handleOpenConversation(username: string) {
    try {
      const conv = await api.createConversation(username);
      setSearchQuery('');
      setSearchResults([]);

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
    disconnectSocket();
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
  const isPeerDeleted = Boolean(selectedConversation?.peer.deleted);
  const currentDisplayName = currentUser ? getDisplayName(currentUser) : 'User';

  return (
    <div className="h-screen bg-[#F5F5F0] text-[#202734] flex flex-col overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-[#202734]/10 px-4 sm:px-6 flex items-center justify-between bg-white/70 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#5D866C] flex items-center justify-center text-[#F5F5F0] shadow-xs shrink-0">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 9h8" />
              <path d="M8 13h5" />
            </svg>
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
                            {formatMessageTime(conv.last_message.created_at)}
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
              <div className="h-14 border-b border-[#202734]/10 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
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
                    {isPeerDeleted ? (
                      <span className="text-[11px] text-[#202734]/40 font-medium">
                        Deleted account
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#202734]/50 font-mono">
                        @{selectedConversation.peer.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message History & Live Feed */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
                {/* Compact Left-Aligned Peer Info Card */}
                <div className="p-3 bg-white border border-[#202734]/10 rounded-xl mb-4 flex items-center gap-3.5 shadow-[0_1px_3px_rgba(32,39,52,0.03)]">
                  <Avatar user={selectedConversation.peer} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-semibold text-[#202734]">
                        {getDisplayName(selectedConversation.peer)}
                      </h3>
                      {!isPeerDeleted && (
                        <span className="text-[11px] text-[#202734]/50 font-mono">
                          @{selectedConversation.peer.username}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          isPeerDeleted
                            ? 'text-[#202734]/60 bg-black/5'
                            : 'text-[#5D866C] bg-[#5D866C]/10'
                        }`}
                      >
                        {isPeerDeleted ? 'Deleted account' : 'Direct'}
                      </span>
                    </div>
                    {isPeerDeleted ? (
                      <p className="text-[11px] text-[#202734]/50 mt-0.5">
                        This account has been deleted. Message history is preserved, but no new messages can be sent.
                      </p>
                    ) : selectedConversation.peer.bio ? (
                      <p className="text-[11px] text-[#202734]/70 mt-0.5 truncate">
                        &ldquo;{selectedConversation.peer.bio}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#202734]/40 mt-0.5">
                        Direct conversation with @{selectedConversation.peer.username}
                      </p>
                    )}
                  </div>
                </div>

                {loadingMessages ? (
                  <div className="text-center py-6 text-xs text-[#202734]/50 font-mono">
                    Loading messages...
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[85%] sm:max-w-md ${
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {!isOwn && (
                            <Avatar
                              user={selectedConversation.peer}
                              size="sm"
                              className="mb-0.5 shrink-0"
                            />
                          )}
                          <div
                            className={`px-3.5 py-2 text-xs leading-relaxed shadow-2xs break-words ${
                              isOwn
                                ? 'bg-[#5D866C] text-[#F5F5F0] rounded-2xl rounded-tr-xs'
                                : 'bg-white text-[#202734] border border-[#202734]/10 rounded-2xl rounded-tl-xs'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-[10px] mt-1 px-1 font-mono ${
                            isOwn ? 'text-[#202734]/50' : 'text-[#202734]/40'
                          }`}
                        >
                          {!isOwn && (
                            <span className="font-sans font-medium text-[#202734]/60">
                              {getDisplayName(selectedConversation.peer)} •
                            </span>
                          )}
                          <span>{formatMessageTime(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Send Form */}
              <div className="p-3 bg-white border-t border-[#202734]/10 shrink-0">
                {sendError && (
                  <div className="mb-2 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {sendError}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isPeerDeleted || sending}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      isPeerDeleted
                        ? 'Cannot send messages to a deleted account.'
                        : 'Type a message...'
                    }
                    maxLength={2000}
                    className="flex-1 px-3.5 py-2 bg-[#F5F5F0] border border-[#202734]/10 rounded-lg text-xs text-[#202734] placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-1 focus:ring-[#5D866C] disabled:bg-black/5 disabled:cursor-not-allowed disabled:placeholder:text-[#202734]/40 transition"
                  />
                  <button
                    type="submit"
                    disabled={isPeerDeleted || sending || !messageInput.trim()}
                    className="px-4 py-2 bg-[#5D866C] hover:bg-[#4d705a] active:bg-[#41604c] disabled:opacity-40 disabled:cursor-not-allowed text-[#F5F5F0] text-xs font-medium rounded-lg transition shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    {sending ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </button>
                </form>
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
