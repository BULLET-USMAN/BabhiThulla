import { GameState, PlayerGameView, PlayerPublicInfo } from './types.js';
import { getLegalMoves } from './legalMoves.js';

/**
 * Creates a sanitized player view containing only information visible to that specific player.
 * Opponents' private card identities are strictly scrubbed, exposing only their hand counts.
 */
export function getPlayerView(state: GameState, playerId: string): PlayerGameView {
  const me = state.players.find((p) => p.id === playerId);
  const myHand = me ? me.hand : [];

  const publicPlayers: PlayerPublicInfo[] = state.players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    cardCount: p.hand.length,
    hasEscaped: p.hasEscaped,
    escapeRank: p.escapeRank,
    isBot: p.isBot,
    seatIndex: p.seatIndex,
  }));

  const legalCards = me ? getLegalMoves(state, playerId) : [];

  return {
    gameId: state.gameId,
    status: state.status,
    myId: playerId,
    myHand,
    players: publicPlayers,
    playerOrder: state.playerOrder,
    currentTurnPlayerId: state.currentTurnPlayerId,
    currentLeaderPlayerId: state.currentLeaderPlayerId,
    leadingSuit: state.leadingSuit,
    currentTrick: state.currentTrick,
    discardCount: state.discardPile.length,
    lastTrickResult: state.lastTrickResult,
    escapedPlayerIds: state.escapedPlayerIds,
    bhabhiPlayerId: state.bhabhiPlayerId,
    turnNumber: state.turnNumber,
    trickNumber: state.trickNumber,
    recentEvents: state.actionHistory.slice(-15),
    legalCardIds: legalCards.map((c) => c.id),
  };
}

/**
 * Creates a fully public game view with no private hands (e.g. for observers/spectators).
 */
export function getPublicGameState(
  state: GameState
): Omit<PlayerGameView, 'myHand' | 'legalCardIds'> {
  const publicPlayers: PlayerPublicInfo[] = state.players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    cardCount: p.hand.length,
    hasEscaped: p.hasEscaped,
    escapeRank: p.escapeRank,
    isBot: p.isBot,
    seatIndex: p.seatIndex,
  }));

  return {
    gameId: state.gameId,
    status: state.status,
    myId: '',
    players: publicPlayers,
    playerOrder: state.playerOrder,
    currentTurnPlayerId: state.currentTurnPlayerId,
    currentLeaderPlayerId: state.currentLeaderPlayerId,
    leadingSuit: state.leadingSuit,
    currentTrick: state.currentTrick,
    discardCount: state.discardPile.length,
    lastTrickResult: state.lastTrickResult,
    escapedPlayerIds: state.escapedPlayerIds,
    bhabhiPlayerId: state.bhabhiPlayerId,
    turnNumber: state.turnNumber,
    trickNumber: state.trickNumber,
    recentEvents: state.actionHistory.slice(-15),
  };
}
