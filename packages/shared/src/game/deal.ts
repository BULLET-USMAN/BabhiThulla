import { Card } from '../models/card.js';
import { MIN_PLAYERS, MAX_PLAYERS } from '../constants/index.js';
import { sortHand } from './cards.js';

export interface DealResult {
  hands: Card[][];
  aceOfSpadesHolderIndex: number;
}

/**
 * Distributes all 52 cards from a shuffled deck clockwise among 3 to 6 players.
 *
 * Hand counts:
 * 3 players: 18, 17, 17
 * 4 players: 13, 13, 13, 13
 * 5 players: 11, 11, 10, 10, 10
 * 6 players: 9, 9, 9, 9, 8, 8
 */
export function dealCards(shuffledDeck: readonly Card[], playerCount: number): DealResult {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`Invalid player count: ${playerCount}. Must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`);
  }
  if (shuffledDeck.length !== 52) {
    throw new Error(`Invalid deck length: ${shuffledDeck.length}. Standard deck must have exactly 52 cards.`);
  }

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let aceOfSpadesHolderIndex = -1;

  for (let i = 0; i < shuffledDeck.length; i++) {
    const card = shuffledDeck[i]!;
    const playerIndex = i % playerCount;
    hands[playerIndex]!.push(card);

    if (card.id === 'spades-A') {
      aceOfSpadesHolderIndex = playerIndex;
    }
  }

  if (aceOfSpadesHolderIndex === -1) {
    throw new Error('Ace of Spades was not found in the dealt deck.');
  }

  // Sort each player's hand by suit and descending rank
  const sortedHands = hands.map((hand) => sortHand(hand));

  return {
    hands: sortedHands,
    aceOfSpadesHolderIndex,
  };
}
