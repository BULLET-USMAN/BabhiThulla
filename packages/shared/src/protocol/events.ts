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

// Emotes & Reactions
export const ALLOWED_EMOTES = [
  { id: 'laugh', symbol: '😂', label: 'Laugh' },
  { id: 'cool', symbol: '😎', label: 'Cool' },
  { id: 'shocked', symbol: '😱', label: 'Shocked' },
  { id: 'crying', symbol: '😭', label: 'Crying' },
  { id: 'clap', symbol: '👏', label: 'Clap' },
  { id: 'skull', symbol: '💀', label: 'Skull' },
  { id: 'fire', symbol: '🔥', label: 'Fire' },
  { id: 'heart', symbol: '❤️', label: 'Heart' },
] as const;

export type EmoteId = (typeof ALLOWED_EMOTES)[number]['id'];

// Quick Chat Predefined Messages
export const ALLOWED_QUICK_CHATS = [
  { id: 'nice_move', text: 'Nice move!' },
  { id: 'thulla', text: 'THULLA!' },
  { id: 'youre_next', text: "You're next!" },
  { id: 'good_game', text: 'Good game!' },
  { id: 'lets_go', text: "Let's go!" },
  { id: 'oops', text: 'Oops!' },
  { id: 'play_faster', text: 'Play faster!' },
  { id: 'rematch', text: 'Rematch?' },
] as const;

export type QuickChatId = (typeof ALLOWED_QUICK_CHATS)[number]['id'];

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

export interface SendEmoteRequest {
  roomCode: string;
  emoteId: EmoteId;
}

export interface SendQuickChatRequest {
  roomCode: string;
  messageId: QuickChatId;
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

export interface EmoteBroadcastPayload {
  roomCode: string;
  playerId: string;
  emoteId: EmoteId;
  symbol: string;
  timestamp: number;
}

export interface QuickChatBroadcastPayload {
  roomCode: string;
  playerId: string;
  messageId: QuickChatId;
  text: string;
  timestamp: number;
}

export interface MultiplayerErrorMessage {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
