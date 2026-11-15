import { PlayerProfile } from './player.js';

export interface RoomParticipant extends PlayerProfile {
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  seatIndex: number;
  cardCount?: number;
}

export interface RoomConfig {
  roomCode: string;
  maxPlayers: number; // 3 to 6
  isPrivate: boolean;
}

export interface RoomPreviewState {
  config: RoomConfig;
  participants: RoomParticipant[];
  hostId: string;
  isGameStarted: boolean;
}
