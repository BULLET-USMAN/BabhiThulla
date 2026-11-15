import { RANK_VALUES } from '../models/card.js';
import { PlayerGameView } from './types.js';

export type BotDifficulty = 'basic' | 'smart';

/**
 * Pure bot AI decision maker.
 * Chooses a legal card ID from the bot's legal moves based on table state.
 * Strictly forbidden from peeking at opponents' private hands.
 */
export function chooseBotMove(
  view: PlayerGameView,
  difficulty: BotDifficulty = 'basic'
): string {
  const legalCardIds = view.legalCardIds;
  if (legalCardIds.length === 0) {
    throw new Error(`Bot ${view.myId} has no legal moves.`);
  }

  // If only 1 move available, bot must play it (e.g. Ace of Spades opening or only 1 card of leading suit)
  if (legalCardIds.length === 1) {
    return legalCardIds[0]!;
  }

  const legalCards = view.myHand.filter((c) => legalCardIds.includes(c.id));

  // Determine if bot is following suit or giving Thulla
  const isFollowingSuit = view.leadingSuit && legalCards[0]!.suit === view.leadingSuit;

  if (isFollowingSuit) {
    // When following suit, sort by rank
    const sorted = [...legalCards].sort(
      (a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]
    );

    if (difficulty === 'basic') {
      // Basic bot: plays lowest legal card to stay safe from high-card Thulla pickup
      return sorted[0]!.id;
    }

    // Smart bot:
    // If trick already has a very high card from an opponent, bot plays lowest matching card.
    return sorted[0]!.id;
  }

  // When giving Thulla (no cards of leading suit):
  // Bot prefers dumping its highest non-leading suit cards (e.g., Kings, Queens, Aces)
  // because getting rid of high cards reduces future Thulla collection risk!
  const sortedDescending = [...legalCards].sort(
    (a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]
  );

  return sortedDescending[0]!.id;
}
