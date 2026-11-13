'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getUser, isAuthenticated, setAuth, clearAuth } from '@/lib/auth';
import { disconnectSocket } from '@/lib/socket';
import { UserProfile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { getDisplayName } from '@/lib/display';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Danger Zone / Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const cached = getUser();
    if (cached) {
      setUser(cached);
      setFirstName(cached.first_name);
      setLastName(cached.last_name);
      setBio(cached.bio);
    }

    api.getMe()
      .then((fresh) => {
        setUser(fresh);
        setFirstName(fresh.first_name);
        setLastName(fresh.last_name);
        setBio(fresh.bio);

        const token = localStorage.getItem('dm_auth_token');
        if (token) setAuth(token, fresh);
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

  // Close delete modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDeleteModalOpen && !deleting) {
        setIsDeleteModalOpen(false);
        setDeletePassword('');
        setDeleteError(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteModalOpen, deleting]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    if (firstName.trim().length > 40) {
      setError('First name must not exceed 40 characters.');
      return;
    }
    if (lastName.trim().length > 40) {
      setError('Last name must not exceed 40 characters.');
      return;
    }
    if (bio.trim().length > 200) {
      setError('Bio must not exceed 200 characters.');
      return;
    }

    setSaving(true);

    try {
      const updated = await api.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
      });

      setUser(updated);
      const token = localStorage.getItem('dm_auth_token');
      if (token) setAuth(token, updated);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(e: FormEvent) {
    e.preventDefault();
    if (!deletePassword) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await api.deleteAccount(deletePassword);
      disconnectSocket();
      clearAuth();
      router.replace('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete account. Please verify your password.');
      }
    } finally {
      setDeleting(false);
    }
  }

  function handleLogout() {
    disconnectSocket();
    clearAuth();
    router.replace('/login');
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] text-[#202734]/60">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#5D866C] animate-pulse" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  // Live preview representation
  const previewUser: Pick<UserProfile, 'username' | 'first_name' | 'last_name' | 'deleted'> = {
    username: user?.username || '',
    first_name: firstName,
    last_name: lastName,
    deleted: false,
  };

  const previewDisplayName = getDisplayName(previewUser);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#202734] flex flex-col">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-[#202734]/10 px-6 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 text-xs font-medium text-[#202734]/70 hover:text-[#202734] px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to chat
          </Link>
          <div className="h-4 w-px bg-[#202734]/10" />
          <span className="font-semibold text-sm text-[#202734] tracking-tight">Profile Settings</span>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-[#202734]/60 hover:text-[#202734] px-2.5 py-1.5 rounded-md hover:bg-black/5 transition"
        >
          Sign out
        </button>
      </header>

      {/* Main Form Layout */}
      <main className="flex-1 max-w-xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="bg-white border border-[#202734]/10 rounded-2xl p-8 shadow-[0_2px_12px_rgba(32,39,52,0.04)]">
          {/* Identity Live Preview Hero */}
          <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-[#202734]/10">
            <Avatar user={previewUser} size="xl" className="mb-3" />
            <h1 className="text-xl font-semibold text-[#202734] tracking-tight">
              {previewDisplayName}
            </h1>
            <p className="text-xs text-[#202734]/60 font-mono mt-0.5">@{user?.username}</p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-xs leading-relaxed"
            >
              {error}
            </div>
          )}

          {saveSuccess && (
            <div
              role="status"
              className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs leading-relaxed flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Changes saved successfully</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-xs font-medium text-[#202734]/80 mb-1.5">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  maxLength={40}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alireza"
                  className="w-full px-3 py-2 bg-[#F5F5F0]/60 border border-[#202734]/15 rounded-lg text-[#202734] text-sm placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-2 focus:ring-[#5D866C]/15 transition"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-xs font-medium text-[#202734]/80 mb-1.5">
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  maxLength={40}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. He"
                  className="w-full px-3 py-2 bg-[#F5F5F0]/60 border border-[#202734]/15 rounded-lg text-[#202734] text-sm placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-2 focus:ring-[#5D866C]/15 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="bio" className="block text-xs font-medium text-[#202734]/80">
                  Bio
                </label>
                <span className="text-[11px] text-[#202734]/50">
                  {bio.length} / 200
                </span>
              </div>
              <textarea
                id="bio"
                rows={3}
                maxLength={200}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short note about yourself..."
                className="w-full px-3 py-2 bg-[#F5F5F0]/60 border border-[#202734]/15 rounded-lg text-[#202734] text-sm placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-[#5D866C] focus:ring-2 focus:ring-[#5D866C]/15 transition resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 bg-[#5D866C] hover:bg-[#4d705a] active:bg-[#41604c] disabled:opacity-50 text-[#F5F5F0] font-medium text-sm rounded-lg transition shadow-xs flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving changes...</span>
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-white border border-rose-200/80 rounded-2xl p-6 shadow-[0_2px_12px_rgba(32,39,52,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-rose-900 tracking-tight">Danger zone</h2>
              <p className="text-xs text-[#202734]/65 mt-1 max-w-md leading-relaxed">
                Permanently delete your account and personal details. Your message history will remain readable to recipients as &ldquo;Deleted User&rdquo;.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeletePassword('');
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-medium rounded-lg transition whitespace-nowrap self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Delete account
            </button>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#202734]/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={() => {
            if (!deleting) {
              setIsDeleteModalOpen(false);
              setDeletePassword('');
              setDeleteError(null);
            }
          }}
        >
          <div
            className="bg-white border border-[#202734]/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-semibold text-[#202734]">
                  Delete account
                </h3>
                <p className="text-xs text-[#202734]/70 mt-1 leading-relaxed">
                  This action cannot be undone. Your username, profile info, and login credentials will be permanently erased.
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed"
              >
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-medium text-[#202734]/80 mb-1.5">
                  Confirm your password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoFocus
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 bg-[#F5F5F0]/60 border border-[#202734]/15 rounded-lg text-[#202734] text-sm placeholder:text-[#202734]/40 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 border border-[#202734]/15 hover:bg-black/5 text-[#202734] text-xs font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete permanently'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
