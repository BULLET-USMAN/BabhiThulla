import {
  GameState,
  GameAction,
  GameActionResult,
  GameEvent,
  GamePlayer,
  DEFAULT_RULES_CONFIG,
  GameRulesConfig,
} from './types.js';
import { createDeck, removeCard, getCardDisplayName } from './cards.js';
import { fisherYatesShuffle, createCryptoRng, createSeededRng } from './shuffle.js';
import { dealCards } from './deal.js';
import { isLegalMove } from './legalMoves.js';
import { isThulla, resolveTrick } from './trickResolver.js';
import { getNextTrickTurnPlayerId } from './turnManager.js';
import { assertGameStateInvariants } from './invariants.js';

export interface CreateGameParams {
  gameId?: string;
  players: Array<{
    id: string;
    nickname: string;
    avatar: GamePlayer['avatar'];
    isBot: boolean;
  }>;
  seed?: number;
  rulesConfig?: Partial<GameRulesConfig>;
}

/**
 * Initializes a fresh Bhabhi Thulla match.
 * Deals all 52 cards and locates the Ace of Spades holder to establish the opening lead.
 */
export function createGame({
  gameId = `bhabhi-${Date.now()}`,
  players: playerConfigs,
  seed,
  rulesConfig: customRules,
}: CreateGameParams): GameState {
  if (playerConfigs.length < 3 || playerConfigs.length > 6) {
    throw new Error(`Player count must be between 3 and 6, received ${playerConfigs.length}.`);
  }

  const rng = seed !== undefined ? createSeededRng(seed) : createCryptoRng();
  const deck = createDeck();
  const shuffledDeck = fisherYatesShuffle(deck, rng);

  const { hands, aceOfSpadesHolderIndex } = dealCards(shuffledDeck, playerConfigs.length);

  const players: GamePlayer[] = playerConfigs.map((p, index) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    hand: hands[index]!,
    hasEscaped: false,
    isBot: p.isBot,
    seatIndex: index,
  }));

  const playerOrder = players.map((p) => p.id);
  const firstLeaderId = playerOrder[aceOfSpadesHolderIndex]!;
  const firstLeader = players[aceOfSpadesHolderIndex]!;

  const now = Date.now();
  const initialEvents: GameEvent[] = [
    {
      id: `ev-start-${now}`,
      type: 'GAME_STARTED',
      message: `Match started with ${players.length} players.`,
      timestamp: now,
    },
    {
      id: `ev-deal-${now}`,
      type: 'DEAL_COMPLETED',
      message: `${firstLeader.nickname} holds the Ace of Spades and leads the opening trick!`,
      timestamp: now,
      playerId: firstLeaderId,
    },
  ];

  const rulesConfig: GameRulesConfig = {
    ...DEFAULT_RULES_CONFIG,
    ...customRules,
  };

  const state: GameState = {
    gameId,
    status: 'playing',
    players,
    playerOrder,
    currentTurnPlayerId: firstLeaderId,
    currentLeaderPlayerId: firstLeaderId,
    leadingSuit: null,
    currentTrick: [],
    discardPile: [],
    lastTrickResult: null,
    escapedPlayerIds: [],
    bhabhiPlayerId: null,
    turnNumber: 1,
    trickNumber: 1,
    actionHistory: initialEvents,
    rulesConfig,
    activeTrickParticipants: [...playerOrder],
  };

  assertGameStateInvariants(state);
  return state;
}

/**
 * Pure transition engine: processes an action and produces the next validated GameState.
 */
export function stepGame(state: GameState, action: GameAction): GameActionResult {
  try {
    switch (action.type) {
      case 'START_GAME': {
        const nextState = createGame({
          players: action.players,
          seed: action.seed,
          rulesConfig: action.rulesConfig,
        });
        return {
          success: true,
          state: nextState,
          events: nextState.actionHistory,
        };
      }

      case 'RESTART_GAME': {
        const nextState = createGame({
          gameId: state.gameId,
          players: state.players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            avatar: p.avatar,
            isBot: p.isBot,
          })),
          seed: action.seed,
          rulesConfig: state.rulesConfig,
        });
        return {
          success: true,
          state: nextState,
          events: nextState.actionHistory,
        };
      }

      case 'PLAY_CARD': {
        if (state.status !== 'playing') {
          return {
            success: false,
            state,
            error: 'Game is not in active playing state.',
          };
        }

        const validation = isLegalMove(state, action.playerId, action.cardId);
        if (!validation.valid || !validation.card) {
          return {
            success: false,
            state,
            error: validation.reason || 'Illegal move rejected by game engine.',
          };
        }

        const card = validation.card;
        const player = state.players.find((p) => p.id === action.playerId)!;

        // Remove card from player's hand immutably
        const { updatedHand } = removeCard(player.hand, action.cardId);
        const updatedPlayers = state.players.map((p) =>
          p.id === action.playerId ? { ...p, hand: updatedHand } : p
        );

        const now = Date.now();
        const leadingSuit = state.leadingSuit || card.suit;

        const newTrick = [
          ...state.currentTrick,
          {
            card,
            playerId: action.playerId,
            timestamp: now,
          },
        ];

        const playEvent: GameEvent = {
          id: `ev-play-${now}-${action.playerId}`,
          type: 'CARD_PLAYED',
          message: `${player.nickname} played ${getCardDisplayName(card)}.`,
          timestamp: now,
          playerId: action.playerId,
          card,
        };

        const stateAfterCard: GameState = {
          ...state,
          players: updatedPlayers,
          currentTrick: newTrick,
          leadingSuit,
          turnNumber: state.turnNumber + 1,
          actionHistory: [...state.actionHistory, playEvent],
        };

        // Check if Thulla occurred
        const thullaTriggered = isThulla(card, leadingSuit);

        if (thullaTriggered) {
          // Thulla immediately terminates and resolves the trick!
          const { nextState, events } = resolveTrick(stateAfterCard);
          assertGameStateInvariants(nextState);
          return {
            success: true,
            state: nextState,
            events: [playEvent, ...events],
          };
        }

        // Check if trick is complete (all active trick participants have played)
        const nextTurnPlayerId = getNextTrickTurnPlayerId(stateAfterCard);

        if (!nextTurnPlayerId) {
          // Clean trick complete! Resolve trick
          const { nextState, events } = resolveTrick(stateAfterCard);
          assertGameStateInvariants(nextState);
          return {
            success: true,
            state: nextState,
            events: [playEvent, ...events],
          };
        }

        // Advance turn within current trick
        const nextState: GameState = {
          ...stateAfterCard,
          currentTurnPlayerId: nextTurnPlayerId,
        };

        assertGameStateInvariants(nextState);
        return {
          success: true,
          state: nextState,
          events: [playEvent],
        };
      }

      default: {
        return {
          success: false,
          state,
          error: `Unsupported game action type.`,
        };
      }
    }
  } catch (err: unknown) {
    return {
      success: false,
      state,
      error: err instanceof Error ? err.message : 'Unknown game engine error occurred.',
    };
  }
}
