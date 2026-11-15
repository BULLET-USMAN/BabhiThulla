import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase } from '../db/connection.js';
import { GameSession } from '../game/gameSession.js';

describe('Phase 5 — Anti-Cheat Enforcement & Private Card Security', () => {
  beforeAll(async () => {
    await initDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const participants = [
    { id: 'player-1', nickname: 'Alice', avatar: 'avatar-1' as const, isBot: false },
    { id: 'player-2', nickname: 'Bob', avatar: 'avatar-2' as const, isBot: false },
    { id: 'player-3', nickname: 'Charlie', avatar: 'avatar-3' as const, isBot: false },
  ];

  it('rejects out-of-turn card play', async () => {
    const session = new GameSession('ROOM01', {
      roomCode: 'ROOM01',
      participants,
      seed: 42,
    });

    const state = session.getGameState();
    const leaderId = state.currentLeaderPlayerId!;
    const nonLeaderId = participants.find((p) => p.id !== leaderId)!.id;

    const nonLeaderHand = state.players.find((p) => p.id === nonLeaderId)!.hand;
    const cardToPlay = nonLeaderHand[0]!;

    const res = await session.playCard(nonLeaderId, cardToPlay.id, 'req-cheat-1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not.*turn/i);
  });

  it('rejects playing a card that does not belong to the player', async () => {
    const session = new GameSession('ROOM02', {
      roomCode: 'ROOM02',
      participants,
      seed: 42,
    });

    const state = session.getGameState();
    const leaderId = state.currentLeaderPlayerId!;

    // Leader attempts to play a card that is in another player's hand
    const otherPlayer = participants.find((p) => p.id !== leaderId)!;
    const otherHand = state.players.find((p) => p.id === otherPlayer.id)!.hand;
    const cardNotOwned = otherHand[0]!;

    const res = await session.playCard(leaderId, cardNotOwned.id, 'req-cheat-2');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not in (your|player's) hand|illegal/i);
  });

  it('rejects failing to follow lead suit when player holds lead suit cards', async () => {
    const session = new GameSession('ROOM03', {
      roomCode: 'ROOM03',
      participants,
      seed: 42,
    });

    const state = session.getGameState();
    const leaderId = state.currentLeaderPlayerId!;
    const leaderHand = state.players.find((p) => p.id === leaderId)!.hand;
    const leadCard = leaderHand.find((c) => c.suit === 'spades' && c.rank === 'A') || leaderHand[0]!;

    // Leader plays first card (Spades)
    const play1 = await session.playCard(leaderId, leadCard.id, 'req-legal-1');
    expect(play1.success).toBe(true);

    const nextState = session.getGameState();
    const nextTurnPlayerId = nextState.currentTurnPlayerId!;
    const nextPlayerHand = nextState.players.find((p) => p.id === nextTurnPlayerId)!.hand;

    // Check if next player has spades AND another suit
    const spadesCard = nextPlayerHand.find((c) => c.suit === 'spades');
    const nonSpadesCard = nextPlayerHand.find((c) => c.suit !== 'spades');

    if (spadesCard && nonSpadesCard) {
      // Cheater tries to play nonSpadesCard (illegal renege / revoking)
      const cheatRes = await session.playCard(nextTurnPlayerId, nonSpadesCard.id, 'req-cheat-3');
      expect(cheatRes.success).toBe(false);
      expect(cheatRes.error).toMatch(/must follow.*suit/i);
    }
  });

  it('deduplicates replayed or double-submitted action request IDs', async () => {
    const session = new GameSession('ROOM04', {
      roomCode: 'ROOM04',
      participants,
      seed: 42,
    });

    const state = session.getGameState();
    const leaderId = state.currentLeaderPlayerId!;
    const leaderHand = state.players.find((p) => p.id === leaderId)!.hand;
    const leadCard = leaderHand.find((c) => c.suit === 'spades' && c.rank === 'A') || leaderHand[0]!;

    const firstRes = await session.playCard(leaderId, leadCard.id, 'req-dedup-1');
    expect(firstRes.success).toBe(true);

    // Immediate network retry or replay of identical requestId
    const retryRes = await session.playCard(leaderId, leadCard.id, 'req-dedup-1');
    expect(retryRes.success).toBe(true); // Handled idempotently without error or secondary state advance
  });

  it('rejects card play when game is in paused state', async () => {
    const session = new GameSession('ROOM05', {
      roomCode: 'ROOM05',
      participants,
      seed: 42,
    });

    session.pause('Player disconnected');
    expect(session.getIsPaused()).toBe(true);

    const state = session.getGameState();
    const leaderId = state.currentLeaderPlayerId!;
    const leaderHand = state.players.find((p) => p.id === leaderId)!.hand;
    const leadCard = leaderHand[0]!;

    const res = await session.playCard(leaderId, leadCard.id, 'req-paused-play');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/paused/i);
  });

  it('verifies strict private card secrecy in player views and public views', () => {
    const session = new GameSession('ROOM06', {
      roomCode: 'ROOM06',
      participants,
      seed: 42,
    });

    const p1 = participants[0]!;
    const p2 = participants[1]!;

    const viewP1 = session.getPlayerView(p1.id);
    expect(viewP1.myHand).toBeDefined();

    // Player 1 must only see Player 2's card count, NOT Player 2's cards
    const p2Summary = viewP1.players.find((p) => p.id === p2.id)!;
    expect((p2Summary as any).hand).toBeUndefined();
    expect(typeof p2Summary.cardCount).toBe('number');

    // Public view must have zero hands
    const publicView = session.getPublicView();
    expect((publicView as any).myHand).toBeUndefined();
    for (const p of publicView.players) {
      expect((p as any).hand).toBeUndefined();
      expect(typeof p.cardCount).toBe('number');
    }
  });
});
