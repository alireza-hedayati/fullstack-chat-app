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
  lg: 'w-10 h-10 text-sm font-bold',
  xl: 'w-13 h-13 text-base font-bold',
};

export function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(user);
  const color = getAvatarColor(user.username || '', user.deleted);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full select-none shrink-0 transition-transform duration-150 ring-1 ring-black/5 dark:ring-white/10 ${SIZE_CLASSES[size]} ${className}`}
      style={{
        background: `linear-gradient(140deg, ${color.bg} 0%, ${color.border} 100%)`,
        color: color.text,
        boxShadow:
          '0 1.5px 3px rgba(32, 39, 52, 0.08), inset 0 1px 0.5px rgba(255, 255, 255, 0.25)',
      }}
      aria-label={`Avatar for ${user.username}`}
    >
      <span className="leading-none transform translate-y-[-0.5px]">{initials}</span>
    </div>
  );
}
