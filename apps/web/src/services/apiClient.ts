import {
  PlayerStats,
  MatchHistoryItem,
  RoomLeaderboardEntry,
  AvatarId,
} from '@bhabhi/shared';

function getApiUrl(): string {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as any).env;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
    if (env?.VITE_SERVER_URL) return env.VITE_SERVER_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if (port === '5173' || port === '4173') {
      return `${protocol}//${hostname}:3001`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

const SERVER_URL = getApiUrl();

export interface GuestRegistrationResult {
  guest: {
    id: string;
    displayName: string;
    avatarId: AvatarId;
    createdAt: number;
  };
  sessionToken: string;
}

export const apiClient = {
  async registerGuest(
    displayName: string,
    avatarId: AvatarId,
    existingGuestId?: string
  ): Promise<GuestRegistrationResult> {
    const res = await fetch(`${SERVER_URL}/api/guest/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, avatarId, existingGuestId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to register guest identity');
    }

    const data = await res.json();
    return data.data;
  },

  async fetchGuestProfile(
    guestId: string,
    sessionToken: string
  ): Promise<{ id: string; displayName: string; avatarId: AvatarId }> {
    const res = await fetch(`${SERVER_URL}/api/guest/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'x-guest-id': guestId,
      },
    });

    if (!res.ok) {
      throw new Error('Invalid or expired guest session');
    }

    const data = await res.json();
    return data.data;
  },

  async fetchPlayerStats(guestId: string): Promise<PlayerStats> {
    const res = await fetch(`${SERVER_URL}/api/stats/${guestId}`);
    if (!res.ok) {
      throw new Error('Failed to retrieve player statistics');
    }
    const data = await res.json();
    return data.data;
  },

  async fetchMatchHistory(params: {
    guestId?: string;
    roomCode?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MatchHistoryItem[]> {
    const query = new URLSearchParams();
    if (params.guestId) query.set('guestId', params.guestId);
    if (params.roomCode) query.set('roomCode', params.roomCode);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const res = await fetch(`${SERVER_URL}/api/matches/history?${query.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to retrieve match history');
    }
    const data = await res.json();
    return data.data;
  },

  async fetchRoomLeaderboard(roomCode: string): Promise<RoomLeaderboardEntry[]> {
    const res = await fetch(`${SERVER_URL}/api/rooms/${roomCode}/leaderboard`);
    if (!res.ok) {
      throw new Error('Failed to retrieve room leaderboard');
    }
    const data = await res.json();
    return data.data;
  },

  async checkReady(): Promise<{ ready: boolean; activeRooms: number }> {
    const res = await fetch(`${SERVER_URL}/api/ready`);
    if (!res.ok) {
      return { ready: false, activeRooms: 0 };
    }
    return res.json();
  },
};
