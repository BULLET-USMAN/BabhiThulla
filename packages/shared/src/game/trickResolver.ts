import { Card, Suit, RANK_VALUES } from '../models/card.js';
import { GameState, PlayedCard, TrickResult, GameEvent } from './types.js';
import { getNextActivePlayerClockwise } from './turnManager.js';
import { sortHand } from './cards.js';

/**
 * Checks whether a played card constitutes a Thulla (played off-suit).
 */
export function isThulla(playedCard: Card, leadingSuit: Suit): boolean {
  return playedCard.suit !== leadingSuit;
}

/**
 * Finds the highest card among those matching the original leading suit.
 */
export function findHighestLeadingSuitCard(
  trick: PlayedCard[],
  leadingSuit: Suit
): PlayedCard {
  const matching = trick.filter((p) => p.card.suit === leadingSuit);
  if (matching.length === 0) {
    throw new Error('No cards matching the leading suit found in trick.');
  }

  let highest = matching[0]!;
  for (let i = 1; i < matching.length; i++) {
    if (RANK_VALUES[matching[i]!.card.rank] > RANK_VALUES[highest.card.rank]) {
      highest = matching[i]!;
    }
  }

  return highest;
}

export interface ResolutionResult {
  nextState: GameState;
  trickResult: TrickResult;
  events: GameEvent[];
}

/**
 * Authoritatively resolves a completed trick (either via Thulla or clean trick discard).
 */
export function resolveTrick(state: GameState): ResolutionResult {
  if (state.currentTrick.length === 0 || !state.leadingSuit) {
    throw new Error('Cannot resolve an empty trick.');
  }

  const events: GameEvent[] = [];
  const now = Date.now();
  const leadingSuit = state.leadingSuit;
  const lastPlayed = state.currentTrick[state.currentTrick.length - 1]!;
  const trickHasThulla = isThulla(lastPlayed.card, leadingSuit);

  let updatedPlayers = state.players.map((p) => ({
    ...p,
    hand: [...p.hand],
  }));

  let updatedDiscardPile = [...state.discardPile];
  let collectorPlayerId: string | undefined;
  let winnerPlayerId: string | undefined;
  let nextLeaderPlayerId: string;

  if (trickHasThulla) {
    // -------------------------------------------------------------
    // THULLA RESOLUTION
    // -------------------------------------------------------------
    const highestLeadCard = findHighestLeadingSuitCard(state.currentTrick, leadingSuit);
    collectorPlayerId = highestLeadCard.playerId;

    events.push({
      id: `ev-thulla-${now}`,
      type: 'THULLA_OCCURRED',
      message: `THULLA! ${lastPlayed.playerId} played ${lastPlayed.card.rank} of ${lastPlayed.card.suit}.`,
      timestamp: now,
      playerId: lastPlayed.playerId,
      card: lastPlayed.card,
    });

    // Give ALL trick cards to the collector
    const trickCards = state.currentTrick.map((p) => p.card);
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.id === collectorPlayerId) {
        return {
          ...p,
          hand: sortHand([...p.hand, ...trickCards]),
        };
      }
      return p;
    });

    events.push({
      id: `ev-collect-${now}`,
      type: 'PILE_COLLECTED',
      message: `${collectorPlayerId} played highest ${leadingSuit} (${highestLeadCard.card.rank}) and collects ${trickCards.length} cards.`,
      timestamp: now,
      playerId: collectorPlayerId,
      details: { cardCount: trickCards.length },
    });

    // Collector leads the next trick
    nextLeaderPlayerId = collectorPlayerId;
  } else {
    // -------------------------------------------------------------
    // NORMAL CLEAN TRICK RESOLUTION
    // -------------------------------------------------------------
    const highestLeadCard = findHighestLeadingSuitCard(state.currentTrick, leadingSuit);
    winnerPlayerId = highestLeadCard.playerId;

    // Discard all trick cards permanently
    const trickCards = state.currentTrick.map((p) => p.card);
    updatedDiscardPile = [...updatedDiscardPile, ...trickCards];

    events.push({
      id: `ev-clean-${now}`,
      type: 'TRICK_RESOLVED',
      message: `Clean trick discarded. ${winnerPlayerId} played highest card (${highestLeadCard.card.rank} of ${leadingSuit}).`,
      timestamp: now,
      playerId: winnerPlayerId,
    });

    nextLeaderPlayerId = winnerPlayerId;
  }

  // -------------------------------------------------------------
  // ESCAPE & ELIMINATION CHECK
  // -------------------------------------------------------------
  const newlyEscaped: string[] = [];
  let currentEscapeCount = state.escapedPlayerIds.length;

  updatedPlayers = updatedPlayers.map((p) => {
    // A player only escapes if their hand is empty AND they are not the collector
    if (!p.hasEscaped && p.hand.length === 0) {
      currentEscapeCount++;
      newlyEscaped.push(p.id);
      events.push({
        id: `ev-escape-${p.id}-${now}`,
        type: 'PLAYER_ESCAPED',
        message: `${p.nickname} has emptied their hand and escaped! (Rank #${currentEscapeCount})`,
        timestamp: now,
        playerId: p.id,
      });

      return {
        ...p,
        hasEscaped: true,
        escapeRank: currentEscapeCount,
      };
    }
    return p;
  });

  const allEscapedIds = [...state.escapedPlayerIds, ...newlyEscaped];

  // If the next leader just escaped, pass lead clockwise to next active player
  if (allEscapedIds.includes(nextLeaderPlayerId)) {
    const fallbackLeader = getNextActivePlayerClockwise(
      state.playerOrder,
      allEscapedIds,
      nextLeaderPlayerId
    );
    if (fallbackLeader) {
      nextLeaderPlayerId = fallbackLeader;
    }
  }

  // -------------------------------------------------------------
  // BHABHI / END OF MATCH CHECK
  // -------------------------------------------------------------
  const remainingActivePlayers = updatedPlayers.filter((p) => !p.hasEscaped);
  let bhabhiPlayerId: string | null = null;
  let status = state.status;

  if (remainingActivePlayers.length === 1) {
    bhabhiPlayerId = remainingActivePlayers[0]!.id;
    status = 'finished';

    events.push({
      id: `ev-bhabhi-${now}`,
      type: 'BHABHI_DECLARED',
      message: `BHABHI MIL GAYI! ${remainingActivePlayers[0]!.nickname} is the Bhabhi!`,
      timestamp: now,
      playerId: bhabhiPlayerId,
    });
  } else if (remainingActivePlayers.length === 0) {
    // Special tie-break edge case: all remaining players emptied hand in final trick
    if (state.rulesConfig.simultaneousEmptyHandsTieBreak === 'highest_lead_card') {
      bhabhiPlayerId = winnerPlayerId || state.playerOrder[0]!;
    } else {
      bhabhiPlayerId = state.playerOrder[0]!;
    }
    status = 'finished';

    events.push({
      id: `ev-bhabhi-tie-${now}`,
      type: 'BHABHI_DECLARED',
      message: `All hands emptied simultaneously! ${bhabhiPlayerId} declared Bhabhi by tie-break rule.`,
      timestamp: now,
      playerId: bhabhiPlayerId,
    });
  }

  // Prepare next trick snapshot of participants
  const nextParticipants = state.playerOrder.filter((id) => !allEscapedIds.includes(id));

  const trickResult: TrickResult = {
    trickNumber: state.trickNumber,
    leadingSuit,
    cards: [...state.currentTrick],
    isThulla: trickHasThulla,
    thullaPlayerId: trickHasThulla ? lastPlayed.playerId : undefined,
    collectorPlayerId,
    winnerPlayerId,
    nextLeaderPlayerId,
    escapedThisTrick: newlyEscaped,
  };

  const nextState: GameState = {
    ...state,
    status,
    players: updatedPlayers,
    currentTrick: [],
    leadingSuit: null,
    discardPile: updatedDiscardPile,
    lastTrickResult: trickResult,
    escapedPlayerIds: allEscapedIds,
    bhabhiPlayerId,
    currentLeaderPlayerId: status === 'finished' ? null : nextLeaderPlayerId,
    currentTurnPlayerId: status === 'finished' ? null : nextLeaderPlayerId,
    trickNumber: state.trickNumber + 1,
    actionHistory: [...state.actionHistory, ...events],
    activeTrickParticipants: nextParticipants,
  };

  return {
    nextState,
    trickResult,
    events,
  };
}
