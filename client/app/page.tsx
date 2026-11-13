'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/chat');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] text-[#202734]/60">
      <div className="flex items-center space-x-2 text-xs font-mono">
        <div className="w-2 h-2 rounded-full bg-[#5D866C] animate-pulse" />
        <span>Loading messenger...</span>
      </div>
    </div>
  );
}
