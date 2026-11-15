export type AvatarId =
  | 'avatar-1'
  | 'avatar-2'
  | 'avatar-3'
  | 'avatar-4'
  | 'avatar-5'
  | 'avatar-6'
  | 'avatar-7'
  | 'avatar-8';

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: AvatarId;
}

export interface GuestSettings {
  nickname: string;
  avatar: AvatarId;
  soundEnabled: boolean;
  sfxEnabled?: boolean;
  volume?: number;
  reducedMotion: boolean;
  animationSpeed?: 'normal' | 'fast' | 'reduced';
  muteEmotes?: boolean;
  muteQuickChat?: boolean;
  dragAndDropEnabled?: boolean;
  cardSize: 'compact' | 'normal' | 'large';
}

export const DEFAULT_GUEST_SETTINGS: GuestSettings = {
  nickname: 'Player',
  avatar: 'avatar-1',
  soundEnabled: true,
  sfxEnabled: true,
  volume: 70,
  reducedMotion: false,
  animationSpeed: 'normal',
  muteEmotes: false,
  muteQuickChat: false,
  dragAndDropEnabled: true,
  cardSize: 'normal',
};

export const AVAILABLE_AVATARS: Array<{
  id: AvatarId;
  label: string;
  emoji: string;
  color: string;
}> = [
  { id: 'avatar-1', label: 'Ace Tiger', emoji: '🐯', color: '#E5C158' },
  { id: 'avatar-2', label: 'Royal Falcon', emoji: '🦅', color: '#38BDF8' },
  { id: 'avatar-3', label: 'Brave Lion', emoji: '🦁', color: '#F97316' },
  { id: 'avatar-4', label: 'Clever Fox', emoji: '🦊', color: '#FB923C' },
  { id: 'avatar-5', label: 'Shadow Wolf', emoji: '🐺', color: '#A855F7' },
  { id: 'avatar-6', label: 'Stallion', emoji: '🐎', color: '#10B981' },
  { id: 'avatar-7', label: 'Golden Eagle', emoji: '👑', color: '#FACC15' },
  { id: 'avatar-8', label: 'Mystic Owl', emoji: '🦉', color: '#EC4899' },
];
