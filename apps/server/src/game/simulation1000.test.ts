import { describe, it, expect } from 'vitest';
import {
  createGame,
  stepGame,
  checkGameStateInvariants,
  getPlayerView,
  chooseBotMove,
  AvatarId,
  DEFAULT_RULES_CONFIG,
} from '@bhabhi/shared';

describe('Phase 5 — 1,000 Automated Multiplayer Simulations with Invariant Verification', () => {
  const AVATARS: AvatarId[] = [
    'avatar-1',
    'avatar-2',
    'avatar-3',
    'avatar-4',
    'avatar-5',
    'avatar-6',
  ];

  function runSimulationBatch(playerCount: number, iterations: number, seedOffset: number) {
    let completedCount = 0;
    let totalTricksAccumulator = 0;
    let totalThullasAccumulator = 0;

    for (let i = 0; i < iterations; i++) {
      const seed = seedOffset + i * 7 + 13;
      const players = Array.from({ length: playerCount }, (_, idx) => ({
        id: `sim-player-${idx + 1}`,
        nickname: `Bot_${idx + 1}`,
        avatar: AVATARS[idx % AVATARS.length] as AvatarId,
        isBot: true,
      }));

      let state = createGame({
        gameId: `sim-${playerCount}p-${i}`,
        players,
        seed,
        rulesConfig: DEFAULT_RULES_CONFIG,
      });

      let turnsCount = 0;
      const maxTurns = 600; // Safeguard against runaway loops
      let thullasInGame = 0;

      while (state.status === 'playing' && turnsCount < maxTurns) {
        turnsCount++;
        const currentTurnPlayerId = state.currentTurnPlayerId;
        expect(currentTurnPlayerId).toBeDefined();

        const player = state.players.find((p) => p.id === currentTurnPlayerId);
        expect(player).toBeDefined();
        expect(player!.hasEscaped).toBe(false);

        const view = getPlayerView(state, currentTurnPlayerId!);
        expect(view.legalCardIds.length).toBeGreaterThan(0);

        const chosenCardId = chooseBotMove(view, i % 2 === 0 ? 'smart' : 'basic');
        expect(view.legalCardIds).toContain(chosenCardId);

        const stepResult = stepGame(state, {
          type: 'PLAY_CARD',
          playerId: currentTurnPlayerId!,
          cardId: chosenCardId,
        });

        expect(stepResult.success).toBe(true);

        if (stepResult.events?.some((e) => e.type === 'THULLA_OCCURRED')) {
          thullasInGame++;
        }

        state = stepResult.state;

        // Invariant check on intermediate state: Exactly 52 cards conserved across all zones
        const violations = checkGameStateInvariants(state);
        expect(violations).toHaveLength(0);
      }

      // Assert game finished properly
      expect(state.status).toBe('finished');
      expect(state.bhabhiPlayerId).toBeDefined();

      const bhabhi = state.players.find((p) => p.id === state.bhabhiPlayerId);
      expect(bhabhi).toBeDefined();
      expect(bhabhi!.hasEscaped).toBe(false);
      expect(bhabhi!.hand.length).toBeGreaterThan(0);

      // Verify all other players escaped in valid sequence
      const escapedPlayers = state.players.filter((p) => p.id !== state.bhabhiPlayerId);
      expect(escapedPlayers.length).toBe(playerCount - 1);

      for (const ep of escapedPlayers) {
        expect(ep.hasEscaped).toBe(true);
        expect(ep.hand.length).toBe(0);
        expect(ep.escapeRank).toBeDefined();
        expect(ep.escapeRank).toBeGreaterThanOrEqual(1);
        expect(ep.escapeRank).toBeLessThanOrEqual(playerCount - 1);
      }

      // Verify escape ranks are strictly distinct
      const ranks = escapedPlayers.map((p) => p.escapeRank!);
      const uniqueRanks = new Set(ranks);
      expect(uniqueRanks.size).toBe(playerCount - 1);

      completedCount++;
      totalTricksAccumulator += state.trickNumber;
      totalThullasAccumulator += thullasInGame;
    }

    return { completedCount, totalTricksAccumulator, totalThullasAccumulator };
  }

  it('runs 250 matches for 3 players (100% completion, 52-card conservation)', () => {
    const res = runSimulationBatch(3, 250, 1000);
    expect(res.completedCount).toBe(250);
    expect(res.totalTricksAccumulator).toBeGreaterThan(250 * 5);
  });

  it('runs 250 matches for 4 players (100% completion, 52-card conservation)', () => {
    const res = runSimulationBatch(4, 250, 3000);
    expect(res.completedCount).toBe(250);
    expect(res.totalTricksAccumulator).toBeGreaterThan(250 * 6);
  });

  it('runs 250 matches for 5 players (100% completion, 52-card conservation)', () => {
    const res = runSimulationBatch(5, 250, 5000);
    expect(res.completedCount).toBe(250);
    expect(res.totalTricksAccumulator).toBeGreaterThan(250 * 7);
  });

  it('runs 250 matches for 6 players (100% completion, 52-card conservation)', () => {
    const res = runSimulationBatch(6, 250, 7000);
    expect(res.completedCount).toBe(250);
    expect(res.totalTricksAccumulator).toBeGreaterThan(250 * 8);
  });
});
