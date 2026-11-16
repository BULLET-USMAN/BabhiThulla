import { Share } from '@capacitor/share';
import { isNativePlatform } from './platform.js';

export interface ShareInviteOptions {
  roomCode: string;
  inviteUrl: string;
}

export interface ShareResult {
  completed: boolean;
  action: 'shared' | 'copied' | 'dismissed';
}

export async function shareRoomInvite(options: ShareInviteOptions): Promise<ShareResult> {
  const { roomCode, inviteUrl } = options;
  const message = `Join my Bhabhi Thulla room!\nRoom Code: ${roomCode}\n\nJoin directly: ${inviteUrl}`;

  if (isNativePlatform()) {
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: 'Join my Bhabhi Thulla room!',
          text: message,
          url: inviteUrl,
          dialogTitle: 'Invite friends to Bhabhi Thulla',
        });
        return { completed: true, action: 'shared' };
      }
    } catch {
      // User cancelled share sheet or error
      return { completed: false, action: 'dismissed' };
    }
  }

  // Web Share API fallback
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Bhabhi Thulla Room Invite',
        text: message,
        url: inviteUrl,
      });
      return { completed: true, action: 'shared' };
    } catch {
      // User dismissed share dialog
    }
  }

  // Clipboard fallback
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl);
      return { completed: true, action: 'copied' };
    }
  } catch {
    // Clipboard failed
  }

  return { completed: false, action: 'dismissed' };
}
