'use client';

import { useEffect } from 'react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ isOpen, onClose, onConfirm }: SignOutModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#202734]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-dialog-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#202734]/15 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#5D866C]/10 border border-[#5D866C]/20 flex items-center justify-center text-[#5D866C] shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <div>
            <h3 id="signout-dialog-title" className="text-base font-semibold text-[#202734] leading-tight">
              Sign out?
            </h3>
            <p className="text-xs text-[#202734]/70 mt-1 leading-relaxed">
              Are you sure you want to end your session? You will need your credentials to log back in.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#202734]/15 hover:bg-black/5 text-[#202734] text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-[#202734] hover:bg-[#202734]/90 active:bg-black text-[#F5F5F0] text-xs font-medium rounded-lg transition shadow-xs cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
