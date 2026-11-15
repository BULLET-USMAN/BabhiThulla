import { describe, expect, it } from 'vitest';
import { getLegalMoves, isLegalMove } from './legalMoves.js';
import { createGame } from './gameEngine.js';

describe('Game Engine: Legal Moves Module', () => {
  const players = [
    { id: 'p1', nickname: 'Ali', avatar: 'avatar-1' as const, isBot: false },
    { id: 'p2', nickname: 'Farhan', avatar: 'avatar-2' as const, isBot: true },
    { id: 'p3', nickname: 'Zainab', avatar: 'avatar-3' as const, isBot: true },
    { id: 'p4', nickname: 'Hamza', avatar: 'avatar-4' as const, isBot: true },
  ];

  it('enforces Ace of Spades as the sole legal opening move', () => {
    const state = createGame({ players, seed: 100 });
    const leaderId = state.currentLeaderPlayerId!;

    const legal = getLegalMoves(state, leaderId);
    expect(legal).toHaveLength(1);
    expect(legal[0]!.id).toBe('spades-A');

    // Attempting to play non-Ace of Spades is rejected
    const leaderHand = state.players.find((p) => p.id === leaderId)!.hand;
    const otherCard = leaderHand.find((c) => c.id !== 'spades-A')!;

    const validation = isLegalMove(state, leaderId, otherCard.id);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('Ace of Spades');
  });

  it('rejects moves from out-of-turn players', () => {
    const state = createGame({ players, seed: 100 });
    const notLeaderId = state.playerOrder.find((id) => id !== state.currentLeaderPlayerId)!;
    const notLeaderCard = state.players.find((p) => p.id === notLeaderId)!.hand[0]!;

    const validation = isLegalMove(state, notLeaderId, notLeaderCard.id);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('not your turn');
  });

  it('strictly enforces following suit when cards of leading suit are held', () => {
    let state = createGame({ players, seed: 100 });
    const leaderId = state.currentLeaderPlayerId!;

    // Leader plays Ace of Spades
    const p1Card = state.players.find((p) => p.id === leaderId)!.hand.find((c) => c.id === 'spades-A')!;
    state = {
      ...state,
      currentTrick: [{ card: p1Card, playerId: leaderId, timestamp: Date.now() }],
      leadingSuit: 'spades',
      currentTurnPlayerId: state.playerOrder[(state.playerOrder.indexOf(leaderId) + 1) % 4]!,
    };

    const nextPlayerId = state.currentTurnPlayerId!;
    const nextPlayer = state.players.find((p) => p.id === nextPlayerId)!;
    const spadeCards = nextPlayer.hand.filter((c) => c.suit === 'spades');
    const nonSpadeCards = nextPlayer.hand.filter((c) => c.suit !== 'spades');

    if (spadeCards.length > 0) {
      // Must follow spades
      const legal = getLegalMoves(state, nextPlayerId);
      expect(legal.every((c) => c.suit === 'spades')).toBe(true);

      if (nonSpadeCards.length > 0) {
        const offSuitValidation = isLegalMove(state, nextPlayerId, nonSpadeCards[0]!.id);
        expect(offSuitValidation.valid).toBe(false);
        expect(offSuitValidation.reason).toContain('must follow suit');
      }
    }
  });
});
