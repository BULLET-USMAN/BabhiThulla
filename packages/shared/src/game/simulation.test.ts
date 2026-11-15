import { describe, expect, it } from 'vitest';
import { createGame, stepGame } from './gameEngine.js';
import { getPlayerView } from './selectors.js';
import { chooseBotMove } from './botStrategy.js';
import { GameState } from './types.js';
import { AvatarId } from '../models/player.js';

describe('Game Engine: Automated Match Simulations (1,000 Matches)', () => {
  const avatars: AvatarId[] = [
    'avatar-1',
    'avatar-2',
    'avatar-3',
    'avatar-4',
    'avatar-5',
    'avatar-6',
    'avatar-7',
    'avatar-8',
  ];

  const runSingleMatch = (
    playerCount: number,
    seed: number,
    maxTricks: number = 800
  ): { state: GameState; tricksPlayed: number; bhabhiId: string } => {
    const players = Array.from({ length: playerCount }, (_, idx) => ({
      id: `bot-${idx + 1}`,
      nickname: `Bot ${idx + 1}`,
      avatar: avatars[idx % avatars.length]!,
      isBot: true,
    }));

    let state = createGame({
      players,
      seed,
      rulesConfig: { maxTricksLimit: maxTricks },
    });

    let safetyCounter = 0;
    const maxActions = maxTricks * playerCount * 2;

    while (state.status === 'playing' && safetyCounter < maxActions) {
      safetyCounter++;
      const currentTurnId = state.currentTurnPlayerId;
      if (!currentTurnId) {
        throw new Error(`Simulation failed: currentTurnPlayerId is null on turn ${state.turnNumber}`);
      }

      const view = getPlayerView(state, currentTurnId);
      const chosenCardId = chooseBotMove(view, 'basic');

      const result = stepGame(state, {
        type: 'PLAY_CARD',
        playerId: currentTurnId,
        cardId: chosenCardId,
      });

      if (!result.success) {
        throw new Error(
          `Simulation illegal move rejected: ${result.error} (player: ${currentTurnId}, card: ${chosenCardId})`
        );
      }

      state = result.state;
    }

    if (state.status !== 'finished') {
      throw new Error(
        `Simulation failed to terminate within ${maxTricks} tricks (Seed: ${seed}, PlayerCount: ${playerCount}). Current status: ${state.status}`
      );
    }

    if (!state.bhabhiPlayerId) {
      throw new Error(`Simulation finished without declaring a Bhabhi (Seed: ${seed})`);
    }

    return {
      state,
      tricksPlayed: state.trickNumber,
      bhabhiId: state.bhabhiPlayerId,
    };
  };

  it('runs 300 automated 3-player matches to completion', () => {
    for (let i = 1; i <= 300; i++) {
      const { state } = runSingleMatch(3, 1000 + i);
      expect(state.status).toBe('finished');
      expect(state.bhabhiPlayerId).toBeTruthy();
    }
  });

  it('runs 400 automated 4-player matches to completion', () => {
    for (let i = 1; i <= 400; i++) {
      const { state } = runSingleMatch(4, 2000 + i);
      expect(state.status).toBe('finished');
      expect(state.bhabhiPlayerId).toBeTruthy();
    }
  });

  it('runs 150 automated 5-player matches to completion', () => {
    for (let i = 1; i <= 150; i++) {
      const { state } = runSingleMatch(5, 3000 + i);
      expect(state.status).toBe('finished');
      expect(state.bhabhiPlayerId).toBeTruthy();
    }
  });

  it('runs 150 automated 6-player matches to completion', () => {
    for (let i = 1; i <= 150; i++) {
      const { state } = runSingleMatch(6, 4000 + i);
      expect(state.status).toBe('finished');
      expect(state.bhabhiPlayerId).toBeTruthy();
    }
  });
});
