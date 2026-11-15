import { AvatarId } from '../models/player.js';
import { PlayerGameView } from '../game/types.js';

export type RoomStatus =
  | 'waiting'
  | 'starting'
  | 'playing'
  | 'paused'
  | 'finished'
  | 'closed';

export interface RoomMember {
  id: string;
  nickname: string;
  avatar: AvatarId;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  seatIndex: number;
  rematchVoted?: boolean;
}

export interface RoomSummary {
  roomId: string;
  roomCode: string;
  hostPlayerId: string;
  maxPlayers: number;
  status: RoomStatus;
  players: RoomMember[];
  isPaused: boolean;
  pauseReason?: string;
  createdAt: number;
}

export interface ClientSessionCredentials {
  playerId: string;
  reconnectToken: string;
  roomCode: string;
}

// Client -> Server Payloads
export interface CreateRoomRequest {
  nickname: string;
  avatar: AvatarId;
  maxPlayers?: number;
  requestId?: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  nickname: string;
  avatar: AvatarId;
  requestId?: string;
}

export interface ReconnectRequest {
  roomCode: string;
  playerId: string;
  reconnectToken: string;
}

export interface ToggleReadyRequest {
  roomCode: string;
  isReady: boolean;
}

export interface StartGameRequest {
  roomCode: string;
}

export interface PlayCardRequest {
  roomCode: string;
  cardId: string;
  requestId: string;
}

export interface RematchVoteRequest {
  roomCode: string;
  vote: boolean;
}

export interface LeaveRoomRequest {
  roomCode: string;
}

// Server -> Client Payloads
export interface ActionAckResponse<T = unknown> {
  success: boolean;
  requestId?: string;
  data?: T;
  error?: string;
}

export interface RoomCreatedResponse {
  room: RoomSummary;
  credentials: ClientSessionCredentials;
}

export interface RoomJoinedResponse {
  room: RoomSummary;
  credentials: ClientSessionCredentials;
}

export interface GameSyncPayload {
  roomCode: string;
  revision: number;
  view: PlayerGameView;
  isPaused: boolean;
  pauseReason?: string;
}

export interface RematchStatusPayload {
  roomCode: string;
  approvals: string[]; // player IDs who approved
  totalRequired: number;
  allApproved: boolean;
}

export interface MultiplayerErrorMessage {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
