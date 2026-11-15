import { eq, desc, and, inArray } from 'drizzle-orm';
import { getDb } from './connection.js';
import {
  gameMatches,
  matchPlayerResults,
} from './schema.js';
import { MatchHistoryItem, AvatarId } from '@bhabhi/shared';

export interface GetMatchHistoryParams {
  guestId?: string;
  roomCode?: string;
  limit?: number;
  offset?: number;
}

export class MatchHistoryRepository {
  /**
   * Retrieves paginated match records with full player results.
   */
  async getMatchHistory(params: GetMatchHistoryParams = {}): Promise<MatchHistoryItem[]> {
    const db = getDb();
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;

    const conditions = [eq(gameMatches.status, 'finished')];

    if (params.roomCode) {
      conditions.push(eq(gameMatches.roomCode, params.roomCode.toUpperCase()));
    }

    // If filtered by guestId, first find matches that player participated in
    if (params.guestId) {
      const playerMatches = await db
        .select({ matchId: matchPlayerResults.matchId })
        .from(matchPlayerResults)
        .where(eq(matchPlayerResults.guestIdentityId, params.guestId));

      const matchIds = playerMatches.map((pm) => pm.matchId);
      if (matchIds.length === 0) {
        return [];
      }
      conditions.push(inArray(gameMatches.id, matchIds));
    }

    const matches = await db
      .select()
      .from(gameMatches)
      .where(and(...conditions))
      .orderBy(desc(gameMatches.finishedAt))
      .limit(limit)
      .offset(offset);

    if (matches.length === 0) {
      return [];
    }

    const historyItems: MatchHistoryItem[] = [];

    for (const match of matches) {
      const results = await db
        .select()
        .from(matchPlayerResults)
        .where(eq(matchPlayerResults.matchId, match.id));

      const bhabhiResult = results.find((r) => r.wasBhabhi) || results[0];

      historyItems.push({
        matchId: match.id,
        roomCode: match.roomCode,
        startedAt: new Date(match.startedAt).getTime(),
        finishedAt: match.finishedAt ? new Date(match.finishedAt).getTime() : Date.now(),
        totalTricks: match.totalTricks,
        playerCount: results.length,
        bhabhiPlayerId: match.bhabhiPlayerId || bhabhiResult?.guestIdentityId || '',
        bhabhiNickname: bhabhiResult?.nickname || 'Unknown',
        bhabhiAvatar: (bhabhiResult?.avatar as AvatarId) || 'avatar-1',
        players: results.map((r) => ({
          guestId: r.guestIdentityId,
          nickname: r.nickname,
          avatar: r.avatar as AvatarId,
          escaped: r.escaped,
          escapeOrder: r.escapeOrder ?? undefined,
          wasBhabhi: r.wasBhabhi,
          finalCardCount: r.finalCardCount,
        })),
      });
    }

    return historyItems;
  }
}

export const matchHistoryRepository = new MatchHistoryRepository();
