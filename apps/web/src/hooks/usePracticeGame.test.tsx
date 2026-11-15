import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { usePracticeGame } from './usePracticeGame.js';
import { ToastProvider } from '../context/ToastContext.js';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('usePracticeGame hook', () => {
  it('initializes game in playing status with Ace of Spades leader', () => {
    const { result } = renderHook(
      () =>
        usePracticeGame({
          playerCount: 4,
          humanNickname: 'Tester',
          humanAvatar: 'avatar-1',
          botDelayMs: 50,
        }),
      { wrapper }
    );

    expect(result.current.gameState.status).toBe('playing');
    expect(result.current.gameState.players).toHaveLength(4);
    expect(result.current.playerView.myHand).toHaveLength(13);
    expect(result.current.gameState.currentLeaderPlayerId).toBeDefined();
  });

  it('allows human player to play Ace of Spades when in turn', () => {
    const { result } = renderHook(
      () =>
        usePracticeGame({
          playerCount: 4,
          humanNickname: 'Tester',
          humanAvatar: 'avatar-1',
          botDelayMs: 50,
        }),
      { wrapper }
    );

    // If human has Ace of Spades, they are in turn
    const humanHoldsAce = result.current.playerView.myHand.some(
      (c) => c.id === 'spades-A'
    );

    if (humanHoldsAce) {
      expect(result.current.playerView.currentTurnPlayerId).toBe('human-player');
      expect(result.current.playerView.legalCardIds).toContain('spades-A');

      let success = false;
      act(() => {
        success = result.current.playHumanCard('spades-A');
      });

      expect(success).toBe(true);
      expect(result.current.gameState.leadingSuit).toBe('spades');
    }
  });

  it('restarts match with fresh deal', () => {
    const { result } = renderHook(
      () =>
        usePracticeGame({
          playerCount: 3,
          humanNickname: 'Tester',
          humanAvatar: 'avatar-1',
        }),
      { wrapper }
    );

    act(() => {
      result.current.restartMatch();
    });

    expect(result.current.gameState.status).toBe('playing');
    expect(result.current.gameState.trickNumber).toBe(1);
    expect(result.current.gameState.turnNumber).toBe(1);
  });
});
