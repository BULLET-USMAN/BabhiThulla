import { Card, Suit } from '../models/card.js';
import { AvatarId } from '../models/player.js';

export type GameStatus = 'waiting' | 'dealing' | 'playing' | 'finished';

export interface GamePlayer {
  id: string;
  nickname: string;
  avatar: AvatarId;
  hand: Card[];
  hasEscaped: boolean;
  escapeRank?: number; // 1 = first to escape, 2 = second, etc.
  isBot: boolean;
  seatIndex: number;
}

export interface PlayedCard {
  card: Card;
  playerId: string;
  timestamp: number;
}

export interface TrickResult {
  trickNumber: number;
  leadingSuit: Suit;
  cards: PlayedCard[];
  isThulla: boolean;
  thullaPlayerId?: string;
  collectorPlayerId?: string; // Player who collected the pile on Thulla
  winnerPlayerId?: string; // Player who won the clean trick
  nextLeaderPlayerId: string;
  escapedThisTrick: string[];
}

export type GameEventType =
  | 'GAME_STARTED'
  | 'DEAL_COMPLETED'
  | 'CARD_PLAYED'
  | 'THULLA_OCCURRED'
  | 'PILE_COLLECTED'
  | 'TRICK_RESOLVED'
  | 'PLAYER_ESCAPED'
  | 'BHABHI_DECLARED';

export interface GameEvent {
  id: string;
  type: GameEventType;
  message: string;
  timestamp: number;
  playerId?: string;
  card?: Card;
  details?: Record<string, unknown>;
}

export interface GameRulesConfig {
  allowThullaOnFirstTrick: boolean; // Traditional Bhabhi Thulla allows Thulla on opening trick
  simultaneousEmptyHandsTieBreak: 'highest_lead_card' | 'clockwise_next';
  maxTricksLimit: number; // Safeguard against non-terminating loops
}

export const DEFAULT_RULES_CONFIG: GameRulesConfig = {
  allowThullaOnFirstTrick: true,
  simultaneousEmptyHandsTieBreak: 'highest_lead_card',
  maxTricksLimit: 1000,
};

export interface GameState {
  gameId: string;
  status: GameStatus;
  players: GamePlayer[];
  playerOrder: string[]; // Player IDs in clockwise order
  currentTurnPlayerId: string | null;
  currentLeaderPlayerId: string | null;
  leadingSuit: Suit | null;
  currentTrick: PlayedCard[];
  discardPile: Card[];
  lastTrickResult: TrickResult | null;
  escapedPlayerIds: string[];
  bhabhiPlayerId: string | null;
  turnNumber: number;
  trickNumber: number;
  actionHistory: GameEvent[];
  rulesConfig: GameRulesConfig;
  activeTrickParticipants: string[]; // Snapshot of players who must play in current trick
}

export type GameAction =
  | {
      type: 'START_GAME';
      players: Array<{
        id: string;
        nickname: string;
        avatar: AvatarId;
        isBot: boolean;
      }>;
      seed?: number;
      rulesConfig?: Partial<GameRulesConfig>;
    }
  | {
      type: 'PLAY_CARD';
      playerId: string;
      cardId: string;
    }
  | {
      type: 'RESTART_GAME';
      seed?: number;
    };

export interface GameActionResult {
  success: boolean;
  state: GameState;
  error?: string;
  events?: GameEvent[];
}

export interface PlayerPublicInfo {
  id: string;
  nickname: string;
  avatar: AvatarId;
  cardCount: number;
  hasEscaped: boolean;
  escapeRank?: number;
  isBot: boolean;
  seatIndex: number;
}

export interface PlayerGameView {
  gameId: string;
  status: GameStatus;
  myId: string;
  myHand: Card[];
  players: PlayerPublicInfo[];
  playerOrder: string[];
  currentTurnPlayerId: string | null;
  currentLeaderPlayerId: string | null;
  leadingSuit: Suit | null;
  currentTrick: PlayedCard[];
  discardCount: number;
  lastTrickResult: TrickResult | null;
  escapedPlayerIds: string[];
  bhabhiPlayerId: string | null;
  turnNumber: number;
  trickNumber: number;
  recentEvents: GameEvent[];
  legalCardIds: string[];
}
