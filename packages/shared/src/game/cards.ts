import { Card, Suit, RANK_VALUES, RANK_NAMES, SUIT_NAMES, SUITS, RANKS } from '../models/card.js';

/**
 * Creates a standard 52-card deck with 4 suits and 13 ranks without jokers.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

/**
 * Compares two cards by rank value (A > K > Q > ... > 2).
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareCards(a: Card, b: Card): number {
  return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
}

/**
 * Checks whether two cards belong to the same suit.
 */
export function isSameSuit(a: Card, b: Card): boolean {
  return a.suit === b.suit;
}

/**
 * Returns human-readable display name, e.g. "Ace of Spades", "King of Diamonds".
 */
export function getCardDisplayName(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;
}

const SUIT_SORT_ORDER: Record<Suit, number> = {
  spades: 0,
  hearts: 1,
  clubs: 2,
  diamonds: 3,
};

/**
 * Sorts a player's hand neatly by suit and descending rank value.
 */
export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_SORT_ORDER[a.suit] - SUIT_SORT_ORDER[b.suit];
    }
    return RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
  });
}

/**
 * Finds a card in a hand by ID.
 */
export function findCard(hand: Card[], cardId: string): Card | undefined {
  return hand.find((c) => c.id === cardId);
}

/**
 * Removes a card from a hand immutably.
 */
export function removeCard(
  hand: Card[],
  cardId: string
): { updatedHand: Card[]; removedCard: Card | null } {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index === -1) {
    return { updatedHand: hand, removedCard: null };
  }
  const removedCard = hand[index]!;
  const updatedHand = [...hand.slice(0, index), ...hand.slice(index + 1)];
  return { updatedHand, removedCard };
}
