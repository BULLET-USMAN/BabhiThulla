import { describe, expect, it } from 'vitest';
import { createGame, stepGame } from './gameEngine.js';

describe('Game Engine: Core Transitions', () => {
  const players = [
    { id: 'p1', nickname: 'Ali', avatar: 'avatar-1' as const, isBot: false },
    { id: 'p2', nickname: 'Farhan', avatar: 'avatar-2' as const, isBot: true },
    { id: 'p3', nickname: 'Zainab', avatar: 'avatar-3' as const, isBot: true },
    { id: 'p4', nickname: 'Hamza', avatar: 'avatar-4' as const, isBot: true },
  ];

  it('starts game in playing state with 13 cards each and Ace of Spades leader', () => {
    const state = createGame({ players, seed: 777 });
    expect(state.status).toBe('playing');
    expect(state.players).toHaveLength(4);
    for (const p of state.players) {
      expect(p.hand).toHaveLength(13);
    }
    expect(state.currentLeaderPlayerId).toBeDefined();
    const leader = state.players.find((p) => p.id === state.currentLeaderPlayerId)!;
    expect(leader.hand.some((c) => c.id === 'spades-A')).toBe(true);
  });

  it('opening card must be Ace of Spades and sets leadingSuit to spades', () => {
    const state = createGame({ players, seed: 777 });
    const leaderId = state.currentLeaderPlayerId!;

    const result = stepGame(state, {
      type: 'PLAY_CARD',
      playerId: leaderId,
      cardId: 'spades-A',
    });

    expect(result.success).toBe(true);
    expect(result.state.leadingSuit).toBe('spades');
    expect(result.state.currentTrick).toHaveLength(1);
    expect(result.state.currentTrick[0]!.card.id).toBe('spades-A');
    expect(result.state.turnNumber).toBe(2);
  });

  it('rejects illegal move and keeps state intact', () => {
    const state = createGame({ players, seed: 777 });
    const leaderId = state.currentLeaderPlayerId!;
    const notAceCard = state.players.find((p) => p.id === leaderId)!.hand.find((c) => c.id !== 'spades-A')!;

    const result = stepGame(state, {
      type: 'PLAY_CARD',
      playerId: leaderId,
      cardId: notAceCard.id,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Ace of Spades');
    expect(result.state).toBe(state); // untouched
  });

  it('restarts game with freshly dealt cards and reset piles', () => {
    let state = createGame({ players, seed: 777 });
    const leaderId = state.currentLeaderPlayerId!;
    state = stepGame(state, { type: 'PLAY_CARD', playerId: leaderId, cardId: 'spades-A' }).state;

    const restartResult = stepGame(state, { type: 'RESTART_GAME', seed: 888 });
    expect(restartResult.success).toBe(true);
    expect(restartResult.state.currentTrick).toHaveLength(0);
    expect(restartResult.state.discardPile).toHaveLength(0);
    expect(restartResult.state.trickNumber).toBe(1);
    expect(restartResult.state.turnNumber).toBe(1);
  });
});
