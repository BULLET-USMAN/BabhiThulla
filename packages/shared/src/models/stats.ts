import { AvatarId } from './player.js';

export interface PlayerStats {
  guestIdentityId: string;
  displayName: string;
  avatarId: AvatarId;
  totalGames: number;
  totalEscapes: number;
  totalBhabhiResults: number;
  totalThullasGiven: number;
  totalPilesCollected: number;
  totalCardsCollected: number;
  totalTricksPlayed: number;
  escapeRate: number; // 0 - 100 percentage
  bhabhiRate: number; // 0 - 100 percentage
  updatedAt: number;
}

export interface MatchPlayerResultRecord {
  guestId: string;
  nickname: string;
  avatar: AvatarId;
  escaped: boolean;
  escapeOrder?: number;
  wasBhabhi: boolean;
  finalCardCount: number;
}

export interface MatchHistoryItem {
  matchId: string;
  roomCode: string;
  startedAt: number;
  finishedAt: number;
  totalTricks: number;
  playerCount: number;
  bhabhiPlayerId: string;
  bhabhiNickname: string;
  bhabhiAvatar: AvatarId;
  players: MatchPlayerResultRecord[];
}

export interface RoomLeaderboardEntry {
  guestId: string;
  nickname: string;
  avatar: AvatarId;
  gamesPlayed: number;
  escapes: number;
  bhabhiCount: number;
  escapeRate: number; // 0 - 100 percentage
  thullasGiven: number;
}

export interface GuestIdentityData {
  guestId: string;
  displayName: string;
  avatar: AvatarId;
  sessionToken: string;
  createdAt: number;
}
