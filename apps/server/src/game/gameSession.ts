import crypto from 'crypto';
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
  checkGameStateInvariants,
} from '@bhabhi/shared';
import { logger } from '../utils/logger.js';
import { encryptSnapshot } from '../security/encryption.js';
import { matchRepository } from '../db/matchRepository.js';
import { statisticsRepository, PlayerMatchDelta } from '../db/statisticsRepository.js';

export interface GameParticipant {
  id: string;
  nickname: string;
  avatar: AvatarId;
  isBot: boolean;
}

export interface GameSessionParams {
  roomCode: string;
  roomId?: string;
  matchId?: string;
  participants: GameParticipant[];
  seed?: number;
  restoredState?: GameState;
  restoredRevision?: number;
  isPaused?: boolean;
  pauseReason?: string;
}

export class GameSession {
  private state: GameState;
  private revision: number = 0;
  private processedRequestIds = new Set<string>();
  private isPaused: boolean = false;
  private pauseReason?: string;
  public matchId: string;
  public readonly roomId: string;

  // Real-time statistics counters for this match
  private thullasGivenMap = new Map<string, number>();
  private pilesCollectedMap = new Map<string, number>();
  private cardsCollectedMap = new Map<string, number>();
  private hasFinalizedStats = false;

  constructor(public readonly roomCode: string, params: GameSessionParams) {
    this.roomId = params.roomId || `room-${roomCode}`;
    this.matchId =
      params.matchId ||
      `match-${roomCode}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    if (params.restoredState) {
      this.state = params.restoredState;
      this.revision = params.restoredRevision ?? 1;
      this.isPaused = params.isPaused ?? true;
      this.pauseReason = params.pauseReason ?? 'Recovered from persistent state after server reboot';
      logger.info(`Game session restored for room ${roomCode} at revision ${this.revision}`, {
        roomCode,
        matchId: this.matchId,
        isPaused: this.isPaused,
      });
    } else {
      this.state = createGame({
        gameId: this.matchId,
        players: params.participants,
        seed: params.seed,
        rulesConfig: DEFAULT_RULES_CONFIG,
      });
      this.revision = 1;
      this.isPaused = false;
      this.pauseReason = undefined;

      // Invariant check on newly created game
      const violations = checkGameStateInvariants(this.state);
      if (violations.length > 0) {
        logger.error('CRITICAL: Invariant violation on game creation', { violations });
      }

      logger.info(`Game session initialized for room ${roomCode}`, {
        roomCode,
        matchId: this.matchId,
        participants: params.participants.map((p) => p.nickname),
        firstLeader: this.state.currentLeaderPlayerId,
      });

      // Persist initial match record and snapshot
      try {
        const encrypted = encryptSnapshot(this.state);
        matchRepository
          .createMatch({
            matchId: this.matchId,
            roomId: this.roomId,
            roomCode: this.roomCode,
            initialRevision: this.revision,
            encryptedState: encrypted,
          })
          .catch((err) => {
            logger.warn('Failed to asynchronously persist initial match state', { err });
          });
      } catch (err) {
        logger.warn('Initial snapshot encryption warning', { err });
      }
    }
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
   * Applies an authoritative card play with deduplication, invariant checks,
   * persistence, and statistics aggregation.
   */
  async playCard(
    playerId: string,
    cardId: string,
    requestId: string
  ): Promise<{
    success: boolean;
    error?: string;
    events?: GameEvent[];
    isThulla?: boolean;
    isCleanTrick?: boolean;
    isFinished?: boolean;
  }> {
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

    // Invariant validation: verify 52-card conservation
    const violations = checkGameStateInvariants(this.state);
    if (violations.length > 0) {
      logger.error('CRITICAL: Invariant violation detected after card play', {
        violations,
        roomCode: this.roomCode,
        revision: this.revision,
      });
    }

    const isThulla = result.events?.some((e) => e.type === 'THULLA_OCCURRED');
    const isCleanTrick = result.events?.some((e) => e.type === 'TRICK_RESOLVED');
    const isFinished = this.state.status === 'finished';

    // Track statistics events
    if (result.events) {
      for (const ev of result.events) {
        if (ev.type === 'THULLA_OCCURRED') {
          const current = this.thullasGivenMap.get(playerId) || 0;
          this.thullasGivenMap.set(playerId, current + 1);
        } else if (ev.type === 'PILE_COLLECTED' && ev.playerId) {
          const piles = this.pilesCollectedMap.get(ev.playerId) || 0;
          this.pilesCollectedMap.set(ev.playerId, piles + 1);
          const cards = this.cardsCollectedMap.get(ev.playerId) || 0;
          const collectedCount = (ev.details?.cardCount as number) || 0;
          this.cardsCollectedMap.set(ev.playerId, cards + collectedCount);
        }
      }
    }

    logger.debug(`Card played in room ${this.roomCode}`, {
      playerId,
      cardId,
      turn: this.state.turnNumber,
      isThulla,
      isFinished,
    });

    // Asynchronously save snapshot and audit log
    try {
      const encrypted = encryptSnapshot(this.state);
      await matchRepository.saveMatchSnapshot(
        this.matchId,
        this.revision,
        encrypted,
        this.roomId,
        this.roomCode
      );
      await matchRepository.recordMatchActivity(this.matchId, this.revision, 'PLAY_CARD', {
        playerId,
        cardId,
        isThulla,
      });
    } catch (err) {
      logger.error('Failed to persist match snapshot or activity log', { err });
    }

    // If game has concluded, finalize results and update statistics idempotently
    if (isFinished && !this.hasFinalizedStats) {
      this.hasFinalizedStats = true;
      await this.finalizeMatchStats();
    }

    return {
      success: true,
      events: result.events,
      isThulla,
      isCleanTrick,
      isFinished,
    };
  }

  /**
   * Finalizes match results in database and atomically updates player statistics.
   */
  private async finalizeMatchStats(): Promise<void> {
    try {
      const bhabhiPlayerId = this.state.bhabhiPlayerId || '';
      const totalTricks = this.state.trickNumber;

      const playerResults = this.state.players.map((p) => {
        const wasBhabhi = p.id === bhabhiPlayerId;
        const escapeIndex = this.state.escapedPlayerIds.indexOf(p.id);
        const escaped = escapeIndex !== -1;
        return {
          guestIdentityId: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
          wasBhabhi,
          escaped,
          escapeOrder: escaped ? escapeIndex + 1 : undefined,
          finalCardCount: p.hand.length,
        };
      });

      await matchRepository.finalizeMatch({
        matchId: this.matchId,
        bhabhiPlayerId,
        totalTricks,
        finalRevision: this.revision,
        results: playerResults,
      });

      const deltas: PlayerMatchDelta[] = this.state.players.map((p) => ({
        guestIdentityId: p.id,
        wasBhabhi: p.id === bhabhiPlayerId,
        escaped: this.state.escapedPlayerIds.includes(p.id),
        thullasGiven: this.thullasGivenMap.get(p.id) || 0,
        pilesCollected: this.pilesCollectedMap.get(p.id) || 0,
        cardsCollected: this.cardsCollectedMap.get(p.id) || 0,
        tricksPlayed: totalTricks,
      }));

      await statisticsRepository.recordMatchStats(deltas);
      logger.info(`Match ${this.matchId} finalized and statistics persisted successfully.`);
    } catch (err) {
      logger.error('Error during match finalization and stat calculation', { err });
    }
  }

  /**
   * Restarts the match with a fresh deal and new Ace of Spades leader.
   */
  async restartMatch(seed?: number): Promise<string> {
    const newMatchId = `match-${this.roomCode}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.matchId = newMatchId;
    this.hasFinalizedStats = false;
    this.thullasGivenMap.clear();
    this.pilesCollectedMap.clear();
    this.cardsCollectedMap.clear();

    const result = stepGame(this.state, {
      type: 'RESTART_GAME',
      seed,
    });
    this.state = result.state;
    this.revision++;
    this.isPaused = false;
    this.pauseReason = undefined;
    this.processedRequestIds.clear();

    try {
      const encrypted = encryptSnapshot(this.state);
      await matchRepository.createMatch({
        matchId: this.matchId,
        roomId: this.roomId,
        roomCode: this.roomCode,
        initialRevision: this.revision,
        encryptedState: encrypted,
      });
    } catch (err) {
      logger.warn('Failed to persist restarted match state', { err });
    }

    logger.info(`Match restarted with fresh deck in room ${this.roomCode}`, {
      matchId: this.matchId,
    });

    return newMatchId;
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
