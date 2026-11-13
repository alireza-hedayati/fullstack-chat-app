import React from 'react';
import { UserProfile } from '@/lib/types';
import { getInitials, getAvatarColor } from '@/lib/display';

interface AvatarProps {
  user: Pick<UserProfile, 'username' | 'first_name' | 'last_name' | 'deleted'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-5.5 h-5.5 text-[10px] font-semibold rounded-md',
  md: 'w-7 h-7 text-xs font-semibold rounded-lg',
  lg: 'w-9 h-9 text-xs font-semibold rounded-xl',
  xl: 'w-12 h-12 text-sm font-semibold rounded-xl',
};

export function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(user);
  const color = getAvatarColor(user.username || '', user.deleted);

  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 transition-colors shadow-2xs ${SIZE_CLASSES[size]} ${className}`}
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
