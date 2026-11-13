import React from 'react';
import { UserProfile } from '@/lib/types';
import { getInitials, getAvatarColor } from '@/lib/display';

interface AvatarProps {
  user: Pick<UserProfile, 'username' | 'first_name' | 'last_name' | 'deleted'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px] font-semibold',
  md: 'w-8 h-8 text-xs font-semibold',
  lg: 'w-12 h-12 text-base font-bold',
  xl: 'w-16 h-16 text-xl font-bold',
};

export function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(user);
  const color = getAvatarColor(user.username || '', user.deleted);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl select-none shrink-0 transition-colors shadow-2xs ${SIZE_CLASSES[size]} ${className}`}
      style={{
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
      }}
      aria-label={`Avatar for ${user.username}`}
    >
      {initials}
    </div>
  );
}
