import { GameState } from './types.js';

export interface InvariantViolation {
  code: string;
  message: string;
}

/**
 * Validates critical game-state conservation laws and integrity rules.
 * Throws or returns detailed violation reports.
 */
export function checkGameStateInvariants(state: GameState): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  // 1. Total Card Conservation Check
  const allCardIds: string[] = [];

  for (const player of state.players) {
    for (const card of player.hand) {
      allCardIds.push(card.id);
    }
  }

  for (const played of state.currentTrick) {
    allCardIds.push(played.card.id);
  }

  for (const card of state.discardPile) {
    allCardIds.push(card.id);
  }

  if (allCardIds.length !== 52) {
    violations.push({
      code: 'CARD_COUNT_MISMATCH',
      message: `Total cards across all zones is ${allCardIds.length}, expected exactly 52.`,
    });
  }

  // 2. Card Uniqueness Check
  const idCounts = new Map<string, number>();
  for (const id of allCardIds) {
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }

  for (const [id, count] of idCounts.entries()) {
    if (count > 1) {
      violations.push({
        code: 'DUPLICATE_CARD_DETECTED',
        message: `Card ${id} appears ${count} times across game zones.`,
      });
    }
  }

  // 3. Turn Sanity Check
  if (state.status === 'playing') {
    if (!state.currentTurnPlayerId) {
      violations.push({
        code: 'MISSING_TURN_OWNER',
        message: 'Active playing state has no currentTurnPlayerId assigned.',
      });
    } else {
      const activePlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);
      if (!activePlayer) {
        violations.push({
          code: 'INVALID_TURN_OWNER',
          message: `currentTurnPlayerId ${state.currentTurnPlayerId} does not exist in players list.`,
        });
      } else if (activePlayer.hasEscaped) {
        violations.push({
          code: 'ESCAPED_PLAYER_IN_TURN',
          message: `Player ${activePlayer.id} has escaped but is marked as the current turn owner.`,
        });
      }
    }
  }

  // 4. Finished State Bhabhi Check
  if (state.status === 'finished') {
    if (!state.bhabhiPlayerId) {
      violations.push({
        code: 'MISSING_BHABHI',
        message: 'Game is finished but no bhabhiPlayerId is declared.',
      });
    }
  }

  return violations;
}

/**
 * Asserts game invariants, throwing an informative Error on any violation.
 */
export function assertGameStateInvariants(state: GameState): void {
  const violations = checkGameStateInvariants(state);
  if (violations.length > 0) {
    throw new Error(
      `Game Invariant Violation(s):\n${violations
        .map((v) => `[${v.code}] ${v.message}`)
        .join('\n')}`
    );
  }
}
