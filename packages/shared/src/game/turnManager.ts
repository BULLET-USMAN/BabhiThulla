import { GameState } from './types.js';

/**
 * Returns the next eligible player ID in clockwise order who has cards and has not escaped.
 */
export function getNextActivePlayerClockwise(
  playerOrder: string[],
  escapedPlayerIds: string[],
  fromPlayerId: string
): string | null {
  const activeOrder = playerOrder.filter((id) => !escapedPlayerIds.includes(id));
  if (activeOrder.length === 0) return null;

  const currentIndex = playerOrder.indexOf(fromPlayerId);
  if (currentIndex === -1) return activeOrder[0] || null;

  // Search clockwise starting from the next position
  for (let i = 1; i <= playerOrder.length; i++) {
    const nextIdx = (currentIndex + i) % playerOrder.length;
    const candidateId = playerOrder[nextIdx]!;
    if (!escapedPlayerIds.includes(candidateId)) {
      return candidateId;
    }
  }

  return activeOrder[0] || null;
}

/**
 * Determines the next player within the CURRENT trick.
 * Checks the snapshot of activeTrickParticipants to see who hasn't played yet in this trick.
 */
export function getNextTrickTurnPlayerId(state: GameState): string | null {
  if (state.currentTrick.length === 0) {
    return state.currentLeaderPlayerId;
  }

  const playedPlayerIds = new Set(state.currentTrick.map((p) => p.playerId));

  // Find the next participant in clockwise order who hasn't played yet
  const lastPlayedId = state.currentTrick[state.currentTrick.length - 1]!.playerId;
  const startIndex = state.playerOrder.indexOf(lastPlayedId);

  for (let i = 1; i <= state.playerOrder.length; i++) {
    const nextIdx = (startIndex + i) % state.playerOrder.length;
    const candidateId = state.playerOrder[nextIdx]!;

    if (
      state.activeTrickParticipants.includes(candidateId) &&
      !playedPlayerIds.has(candidateId)
    ) {
      return candidateId;
    }
  }

  // All active trick participants have played
  return null;
}
