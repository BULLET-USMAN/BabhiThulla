import { describe, expect, it } from 'vitest';
import { checkGameStateInvariants, assertGameStateInvariants } from './invariants.js';
import { createGame } from './gameEngine.js';

describe('Game Engine: Invariants Module', () => {
  const players = [
    { id: 'p1', nickname: 'Ali', avatar: 'avatar-1' as const, isBot: false },
    { id: 'p2', nickname: 'Farhan', avatar: 'avatar-2' as const, isBot: true },
    { id: 'p3', nickname: 'Zainab', avatar: 'avatar-3' as const, isBot: true },
    { id: 'p4', nickname: 'Hamza', avatar: 'avatar-4' as const, isBot: true },
  ];

  it('validates a pristine initial game state without violations', () => {
    const state = createGame({ players, seed: 99 });
    const violations = checkGameStateInvariants(state);
    expect(violations).toHaveLength(0);
    expect(() => assertGameStateInvariants(state)).not.toThrow();
  });

  it('catches missing cards (total < 52)', () => {
    const state = createGame({ players, seed: 99 });
    // Artificially remove one card
    const corruptedPlayers = state.players.map((p, idx) =>
      idx === 0 ? { ...p, hand: p.hand.slice(1) } : p
    );
    const corruptedState = { ...state, players: corruptedPlayers };

    const violations = checkGameStateInvariants(corruptedState);
    expect(violations.some((v) => v.code === 'CARD_COUNT_MISMATCH')).toBe(true);
    expect(() => assertGameStateInvariants(corruptedState)).toThrow();
  });

  it('catches duplicate cards across zones', () => {
    const state = createGame({ players, seed: 99 });
    // Artificially duplicate card into discard pile
    const cardToDuplicate = state.players[0]!.hand[0]!;
    const corruptedState = {
      ...state,
      discardPile: [cardToDuplicate],
    };

    const violations = checkGameStateInvariants(corruptedState);
    expect(violations.some((v) => v.code === 'DUPLICATE_CARD_DETECTED')).toBe(true);
  });
});
