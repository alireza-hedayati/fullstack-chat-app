import { UserProfile } from './types';

export function getDisplayName(
  user: Pick<UserProfile, 'username' | 'first_name' | 'last_name' | 'deleted'>
): string {
  if (user.deleted) {
    return 'Deleted User';
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (fullName.length > 0) {
    return fullName;
  }

  return user.username;
}

export function getInitials(
  user: Pick<UserProfile, 'username' | 'first_name' | 'last_name' | 'deleted'>
): string {
  if (user.deleted) {
    return 'DU';
  }

  const first = user.first_name?.trim() || '';
  const last = user.last_name?.trim() || '';

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }

  if (first) {
    return first.slice(0, 2).toUpperCase();
  }

  if (last) {
    return last.slice(0, 2).toUpperCase();
  }

  return (user.username || 'DM').slice(0, 2).toUpperCase();
}

export interface AvatarColor {
  bg: string;
  text: string;
  border: string;
}

const AVATAR_PALETTE: AvatarColor[] = [
  { bg: '#5D866C', text: '#F5F5F0', border: '#4d705a' }, // Sage accent
  { bg: '#2563eb', text: '#ffffff', border: '#1d4ed8' }, // Cobalt
  { bg: '#7c3aed', text: '#ffffff', border: '#6d28d9' }, // Violet
  { bg: '#0d9488', text: '#ffffff', border: '#0f766e' }, // Teal
  { bg: '#d97706', text: '#ffffff', border: '#b45309' }, // Amber
  { bg: '#e11d48', text: '#ffffff', border: '#be123c' }, // Rose
  { bg: '#0284c7', text: '#ffffff', border: '#0369a1' }, // Sky
  { bg: '#475569', text: '#ffffff', border: '#334155' }, // Slate
];

const DELETED_COLOR: AvatarColor = {
  bg: '#e2e8f0',
  text: '#64748b',
  border: '#cbd5e1',
};

export function getAvatarColor(username: string, deleted: boolean): AvatarColor {
  if (deleted) {
    return DELETED_COLOR;
  }

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
