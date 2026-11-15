import {
  GameState,
  PlayerGameView,
  createGame,
  stepGame,
  getPlayerView,
  getPublicGameState,
  GameEvent,
  AvatarId,
  DEFAULT_RULES_CONFIG,
} from '@bhabhi/shared';
import { logger } from '../utils/logger.js';

export interface GameParticipant {
  id: string;
  nickname: string;
  avatar: AvatarId;
  isBot: boolean;
}

export class GameSession {
  private state: GameState;
  private revision: number = 0;
  private processedRequestIds = new Set<string>();
  private isPaused: boolean = false;
  private pauseReason?: string;

  constructor(
    public readonly roomCode: string,
    participants: GameParticipant[],
    seed?: number
  ) {
    this.state = createGame({
      gameId: `${roomCode}-${Date.now()}`,
      players: participants,
      seed,
      rulesConfig: DEFAULT_RULES_CONFIG,
    });
    this.revision = 1;
    logger.info(`Game session initialized for room ${roomCode}`, {
      roomCode,
      participants: participants.map((p) => p.nickname),
      firstLeader: this.state.currentLeaderPlayerId,
    });
  }

  getRevision(): number {
    return this.revision;
  }

  getGameState(): GameState {
    return this.state;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  getPauseReason(): string | undefined {
    return this.pauseReason;
  }

  pause(reason: string) {
    this.isPaused = true;
    this.pauseReason = reason;
    this.revision++;
    logger.info(`Game paused in room ${this.roomCode}: ${reason}`);
  }

  resume() {
    this.isPaused = false;
    this.pauseReason = undefined;
    this.revision++;
    logger.info(`Game resumed in room ${this.roomCode}`);
  }

  /**
   * Applies an authoritative card play with deduplication and state versioning.
   */
  playCard(
    playerId: string,
    cardId: string,
    requestId: string
  ): {
    success: boolean;
    error?: string;
    events?: GameEvent[];
    isThulla?: boolean;
    isCleanTrick?: boolean;
    isFinished?: boolean;
  } {
    if (this.isPaused) {
      return {
        success: false,
        error: `Game is currently paused. ${this.pauseReason || ''}`,
      };
    }

    // Deduplication check: ignore repeated clicks or network retry duplicates
    if (this.processedRequestIds.has(requestId)) {
      logger.warn(`Duplicate action ignored in room ${this.roomCode}`, { requestId, playerId });
      return { success: true };
    }

    const result = stepGame(this.state, {
      type: 'PLAY_CARD',
      playerId,
      cardId,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Illegal move rejected by game engine.',
      };
    }

    // Mark requestId as processed (bound cache to 200 items)
    this.processedRequestIds.add(requestId);
    if (this.processedRequestIds.size > 200) {
      const oldest = Array.from(this.processedRequestIds)[0];
      if (oldest) this.processedRequestIds.delete(oldest);
    }

    this.state = result.state;
    this.revision++;

    const isThulla = result.events?.some((e) => e.type === 'THULLA_OCCURRED');
    const isCleanTrick = result.events?.some((e) => e.type === 'TRICK_RESOLVED');
    const isFinished = this.state.status === 'finished';

    logger.debug(`Card played in room ${this.roomCode}`, {
      playerId,
      cardId,
      turn: this.state.turnNumber,
      isThulla,
      isFinished,
    });

    return {
      success: true,
      events: result.events,
      isThulla,
      isCleanTrick,
      isFinished,
    };
  }

  /**
   * Restarts the match with a fresh deal and new Ace of Spades leader.
   */
  restartMatch(seed?: number) {
    const result = stepGame(this.state, {
      type: 'RESTART_GAME',
      seed,
    });
    this.state = result.state;
    this.revision++;
    this.isPaused = false;
    this.pauseReason = undefined;
    this.processedRequestIds.clear();

    logger.info(`Match restarted with fresh deck in room ${this.roomCode}`);
  }

  /**
   * Returns a sanitized player view with opponents' private card identities scrubbed.
   */
  getPlayerView(playerId: string): PlayerGameView {
    return getPlayerView(this.state, playerId);
  }

  /**
   * Returns a public view with no hands (for spectators or global sync).
   */
  getPublicView(): Omit<PlayerGameView, 'myHand' | 'legalCardIds'> {
    return getPublicGameState(this.state);
  }
}
