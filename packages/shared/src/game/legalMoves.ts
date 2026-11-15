import { Card } from '../models/card.js';
import { GameState } from './types.js';

export interface MoveValidation {
  valid: boolean;
  reason?: string;
  card?: Card;
}

/**
 * Returns all legally playable cards for a given player in the current game state.
 */
export function getLegalMoves(state: GameState, playerId: string): Card[] {
  if (state.status !== 'playing') {
    return [];
  }

  if (state.currentTurnPlayerId !== playerId) {
    return [];
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hasEscaped || player.hand.length === 0) {
    return [];
  }

  // 1. Ace of Spades Opening Rule:
  // If it is the first trick and the trick is empty, the leader MUST play the Ace of Spades
  if (state.trickNumber === 1 && state.currentTrick.length === 0) {
    const aceOfSpades = player.hand.find((c) => c.id === 'spades-A');
    if (aceOfSpades) {
      return [aceOfSpades];
    }
  }

  // 2. Starting a new trick (Leader plays any card)
  if (state.currentTrick.length === 0 || !state.leadingSuit) {
    return [...player.hand];
  }

  // 3. Following Suit
  const matchingSuitCards = player.hand.filter((c) => c.suit === state.leadingSuit);

  // If player has cards of the leading suit, they MUST play one of them
  if (matchingSuitCards.length > 0) {
    return matchingSuitCards;
  }

  // If player has NO cards of the leading suit, any card is legal (gives Thulla)
  return [...player.hand];
}

/**
 * Validates whether a specific card is legal to play by the player in the current state.
 */
export function isLegalMove(
  state: GameState,
  playerId: string,
  cardId: string
): MoveValidation {
  if (state.status !== 'playing') {
    return { valid: false, reason: 'Game is not in active playing state.' };
  }

  if (state.currentTurnPlayerId !== playerId) {
    return { valid: false, reason: 'It is not your turn to play.' };
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, reason: 'Player not found in this match.' };
  }

  if (player.hasEscaped) {
    return { valid: false, reason: 'You have already escaped and finished your round.' };
  }

  const card = player.hand.find((c) => c.id === cardId);
  if (!card) {
    return { valid: false, reason: 'Card is not in your hand.' };
  }

  const legalMoves = getLegalMoves(state, playerId);
  const isAllowed = legalMoves.some((c) => c.id === cardId);

  if (!isAllowed) {
    // Provide informative rejection reason
    if (state.trickNumber === 1 && state.currentTrick.length === 0) {
      return {
        valid: false,
        reason: 'Opening move must be the Ace of Spades.',
        card,
      };
    }

    if (state.leadingSuit) {
      return {
        valid: false,
        reason: `You must follow suit and play a ${state.leadingSuit.toUpperCase()} card.`,
        card,
      };
    }

    return { valid: false, reason: 'This card is not legal to play right now.', card };
  }

  return { valid: true, card };
}
