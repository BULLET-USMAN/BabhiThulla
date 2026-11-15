import { AvatarId, RoomStatus, RoomSummary, RoomMember } from '@bhabhi/shared';
import { GameSession } from '../game/gameSession.js';

export interface ServerRoomMember {
  id: string;
  nickname: string;
  avatar: AvatarId;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  seatIndex: number;
  disconnectGraceTimer?: NodeJS.Timeout;
  rematchVoted?: boolean;
}

export interface ServerRoom {
  id: string;
  code: string;
  hostPlayerId: string;
  maxPlayers: number;
  status: RoomStatus;
  members: ServerRoomMember[];
  createdAt: number;
  lastActivityAt: number;
  gameSession: GameSession | null;
}

export function toRoomSummary(room: ServerRoom): RoomSummary {
  const members: RoomMember[] = room.members.map((m) => ({
    id: m.id,
    nickname: m.nickname,
    avatar: m.avatar,
    isHost: m.isHost,
    isReady: m.isReady,
    isConnected: m.isConnected,
    seatIndex: m.seatIndex,
    rematchVoted: m.rematchVoted,
  }));

  return {
    roomId: room.id,
    roomCode: room.code,
    hostPlayerId: room.hostPlayerId,
    maxPlayers: room.maxPlayers,
    status: room.status,
    players: members,
    isPaused: room.gameSession ? room.gameSession.getIsPaused() : false,
    pauseReason: room.gameSession ? room.gameSession.getPauseReason() : undefined,
    createdAt: room.createdAt,
  };
}
