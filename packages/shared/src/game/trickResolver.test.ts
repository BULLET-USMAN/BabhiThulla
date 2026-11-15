import { describe, expect, it } from 'vitest';
import {
  isThulla,
  findHighestLeadingSuitCard,
  resolveTrick,
} from './trickResolver.js';
import { GameState, PlayedCard } from './types.js';
import { DEFAULT_RULES_CONFIG } from './types.js';

describe('Game Engine: Trick Resolver Module', () => {
  it('correctly detects Thulla when an off-suit card is played', () => {
    expect(isThulla({ id: 'hearts-3', suit: 'hearts', rank: '3' }, 'spades')).toBe(true);
    expect(isThulla({ id: 'spades-K', suit: 'spades', rank: 'K' }, 'spades')).toBe(false);
  });

  it('correctly finds highest card of original leading suit', () => {
    const trick: PlayedCard[] = [
      { card: { id: 'spades-7', suit: 'spades', rank: '7' }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'spades-K', suit: 'spades', rank: 'K' }, playerId: 'p2', timestamp: 2 },
      { card: { id: 'hearts-A', suit: 'hearts', rank: 'A' }, playerId: 'p3', timestamp: 3 }, // Higher rank than K, but off-suit!
    ];

    const highest = findHighestLeadingSuitCard(trick, 'spades');
    expect(highest.playerId).toBe('p2');
    expect(highest.card.rank).toBe('K');
  });

  it('resolves Thulla: highest leading-suit player collects ALL cards and leads next', () => {
    const trick: PlayedCard[] = [
      { card: { id: 'spades-7', suit: 'spades', rank: '7' }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'spades-K', suit: 'spades', rank: 'K' }, playerId: 'p2', timestamp: 2 },
      { card: { id: 'hearts-3', suit: 'hearts', rank: '3' }, playerId: 'p3', timestamp: 3 }, // Thulla!
    ];

    const initialState: GameState = {
      gameId: 'test',
      status: 'playing',
      players: [
        { id: 'p1', nickname: 'P1', avatar: 'avatar-1', hand: [{ id: 'clubs-2', suit: 'clubs', rank: '2' }], hasEscaped: false, isBot: false, seatIndex: 0 },
        { id: 'p2', nickname: 'P2', avatar: 'avatar-2', hand: [], hasEscaped: false, isBot: true, seatIndex: 1 },
        { id: 'p3', nickname: 'P3', avatar: 'avatar-3', hand: [{ id: 'clubs-4', suit: 'clubs', rank: '4' }], hasEscaped: false, isBot: true, seatIndex: 2 },
      ],
      playerOrder: ['p1', 'p2', 'p3'],
      currentTurnPlayerId: 'p3',
      currentLeaderPlayerId: 'p1',
      leadingSuit: 'spades',
      currentTrick: trick,
      discardPile: [],
      lastTrickResult: null,
      escapedPlayerIds: [],
      bhabhiPlayerId: null,
      turnNumber: 3,
      trickNumber: 1,
      actionHistory: [],
      rulesConfig: DEFAULT_RULES_CONFIG,
      activeTrickParticipants: ['p1', 'p2', 'p3'],
    };

    const { nextState, trickResult } = resolveTrick(initialState);

    expect(trickResult.isThulla).toBe(true);
    expect(trickResult.collectorPlayerId).toBe('p2');
    expect(nextState.currentLeaderPlayerId).toBe('p2');
    expect(nextState.currentTurnPlayerId).toBe('p2');

    // P2 collected all 3 cards
    const p2 = nextState.players.find((p) => p.id === 'p2')!;
    expect(p2.hand).toHaveLength(3);
    expect(nextState.currentTrick).toHaveLength(0);
  });

  it('EDGE CASE: player playing last card does NOT escape if they must collect Thulla pile', () => {
    // P2 plays King of Spades (last card in hand), but P3 gives Thulla. P2 must collect!
    const trick: PlayedCard[] = [
      { card: { id: 'spades-7', suit: 'spades', rank: '7' }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'spades-K', suit: 'spades', rank: 'K' }, playerId: 'p2', timestamp: 2 },
      { card: { id: 'hearts-2', suit: 'hearts', rank: '2' }, playerId: 'p3', timestamp: 3 }, // Thulla!
    ];

    const initialState: GameState = {
      gameId: 'test',
      status: 'playing',
      players: [
        { id: 'p1', nickname: 'P1', avatar: 'avatar-1', hand: [{ id: 'clubs-5', suit: 'clubs', rank: '5' }], hasEscaped: false, isBot: false, seatIndex: 0 },
        { id: 'p2', nickname: 'P2', avatar: 'avatar-2', hand: [], hasEscaped: false, isBot: true, seatIndex: 1 }, // Hand is currently 0 after playing card!
        { id: 'p3', nickname: 'P3', avatar: 'avatar-3', hand: [{ id: 'diamonds-9', suit: 'diamonds', rank: '9' }], hasEscaped: false, isBot: true, seatIndex: 2 },
      ],
      playerOrder: ['p1', 'p2', 'p3'],
      currentTurnPlayerId: 'p3',
      currentLeaderPlayerId: 'p1',
      leadingSuit: 'spades',
      currentTrick: trick,
      discardPile: [],
      lastTrickResult: null,
      escapedPlayerIds: [],
      bhabhiPlayerId: null,
      turnNumber: 3,
      trickNumber: 1,
      actionHistory: [],
      rulesConfig: DEFAULT_RULES_CONFIG,
      activeTrickParticipants: ['p1', 'p2', 'p3'],
    };

    const { nextState } = resolveTrick(initialState);
    const p2 = nextState.players.find((p) => p.id === 'p2')!;

    // P2 collected cards, so has not escaped!
    expect(p2.hasEscaped).toBe(false);
    expect(p2.hand.length).toBe(3);
    expect(nextState.escapedPlayerIds).not.toContain('p2');
  });

  it('clean trick discards cards and winner leads next', () => {
    const trick: PlayedCard[] = [
      { card: { id: 'clubs-5', suit: 'clubs', rank: '5' }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'clubs-J', suit: 'clubs', rank: 'J' }, playerId: 'p2', timestamp: 2 },
      { card: { id: 'clubs-A', suit: 'clubs', rank: 'A' }, playerId: 'p3', timestamp: 3 },
    ];

    const initialState: GameState = {
      gameId: 'test',
      status: 'playing',
      players: [
        { id: 'p1', nickname: 'P1', avatar: 'avatar-1', hand: [{ id: 'hearts-2', suit: 'hearts', rank: '2' }], hasEscaped: false, isBot: false, seatIndex: 0 },
        { id: 'p2', nickname: 'P2', avatar: 'avatar-2', hand: [{ id: 'hearts-3', suit: 'hearts', rank: '3' }], hasEscaped: false, isBot: true, seatIndex: 1 },
        { id: 'p3', nickname: 'P3', avatar: 'avatar-3', hand: [{ id: 'hearts-4', suit: 'hearts', rank: '4' }], hasEscaped: false, isBot: true, seatIndex: 2 },
      ],
      playerOrder: ['p1', 'p2', 'p3'],
      currentTurnPlayerId: 'p3',
      currentLeaderPlayerId: 'p1',
      leadingSuit: 'clubs',
      currentTrick: trick,
      discardPile: [],
      lastTrickResult: null,
      escapedPlayerIds: [],
      bhabhiPlayerId: null,
      turnNumber: 3,
      trickNumber: 1,
      actionHistory: [],
      rulesConfig: DEFAULT_RULES_CONFIG,
      activeTrickParticipants: ['p1', 'p2', 'p3'],
    };

    const { nextState, trickResult } = resolveTrick(initialState);

    expect(trickResult.isThulla).toBe(false);
    expect(trickResult.winnerPlayerId).toBe('p3');
    expect(nextState.discardPile).toHaveLength(3);
    expect(nextState.currentLeaderPlayerId).toBe('p3');
    expect(nextState.currentTurnPlayerId).toBe('p3');
  });

  it('detects Bhabhi when exactly 1 active player remains', () => {
    const trick: PlayedCard[] = [
      { card: { id: 'diamonds-5', suit: 'diamonds', rank: '5' }, playerId: 'p1', timestamp: 1 },
      { card: { id: 'diamonds-A', suit: 'diamonds', rank: 'A' }, playerId: 'p2', timestamp: 2 },
    ];

    // P1 and P2 were active. P2 empties hand and escapes!
    const initialState: GameState = {
      gameId: 'test',
      status: 'playing',
      players: [
        { id: 'p1', nickname: 'P1', avatar: 'avatar-1', hand: [{ id: 'hearts-9', suit: 'hearts', rank: '9' }], hasEscaped: false, isBot: false, seatIndex: 0 },
        { id: 'p2', nickname: 'P2', avatar: 'avatar-2', hand: [], hasEscaped: false, isBot: true, seatIndex: 1 }, // just emptied hand
        { id: 'p3', nickname: 'P3', avatar: 'avatar-3', hand: [], hasEscaped: true, escapeRank: 1, isBot: true, seatIndex: 2 }, // already escaped
      ],
      playerOrder: ['p1', 'p2', 'p3'],
      currentTurnPlayerId: 'p2',
      currentLeaderPlayerId: 'p1',
      leadingSuit: 'diamonds',
      currentTrick: trick,
      discardPile: [],
      lastTrickResult: null,
      escapedPlayerIds: ['p3'],
      bhabhiPlayerId: null,
      turnNumber: 2,
      trickNumber: 5,
      actionHistory: [],
      rulesConfig: DEFAULT_RULES_CONFIG,
      activeTrickParticipants: ['p1', 'p2'],
    };

    const { nextState } = resolveTrick(initialState);

    expect(nextState.status).toBe('finished');
    expect(nextState.bhabhiPlayerId).toBe('p1');
    expect(nextState.escapedPlayerIds).toContain('p2');
  });
});
