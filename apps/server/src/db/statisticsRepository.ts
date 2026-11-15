import { eq, sql, inArray } from 'drizzle-orm';
import { getDb } from './connection.js';
import {
  playerStatistics,
  guestIdentities,
  roomPlayers,
  gameRooms,
} from './schema.js';
import { PlayerStats, RoomLeaderboardEntry, AvatarId } from '@bhabhi/shared';

export interface PlayerMatchDelta {
  guestIdentityId: string;
  wasBhabhi: boolean;
  escaped: boolean;
  thullasGiven: number;
  pilesCollected: number;
  cardsCollected: number;
  tricksPlayed: number;
}

export class StatisticsRepository {
  /**
   * Atomically updates player statistics for all match participants.
   */
  async recordMatchStats(deltas: PlayerMatchDelta[]): Promise<void> {
    const db = getDb();
    const now = new Date();

    for (const d of deltas) {
      await db
        .insert(playerStatistics)
        .values({
          guestIdentityId: d.guestIdentityId,
          totalGames: 1,
          totalEscapes: d.escaped ? 1 : 0,
          totalBhabhiResults: d.wasBhabhi ? 1 : 0,
          totalThullasGiven: d.thullasGiven,
          totalPilesCollected: d.pilesCollected,
          totalCardsCollected: d.cardsCollected,
          totalTricksPlayed: d.tricksPlayed,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: playerStatistics.guestIdentityId,
          set: {
            totalGames: sql`${playerStatistics.totalGames} + 1`,
            totalEscapes: sql`${playerStatistics.totalEscapes} + ${d.escaped ? 1 : 0}`,
            totalBhabhiResults: sql`${playerStatistics.totalBhabhiResults} + ${d.wasBhabhi ? 1 : 0}`,
            totalThullasGiven: sql`${playerStatistics.totalThullasGiven} + ${d.thullasGiven}`,
            totalPilesCollected: sql`${playerStatistics.totalPilesCollected} + ${d.pilesCollected}`,
            totalCardsCollected: sql`${playerStatistics.totalCardsCollected} + ${d.cardsCollected}`,
            totalTricksPlayed: sql`${playerStatistics.totalTricksPlayed} + ${d.tricksPlayed}`,
            updatedAt: now,
          },
        });
    }
  }

  /**
   * Fetches computed statistics for a given guest identity.
   */
  async getPlayerStats(guestIdentityId: string): Promise<PlayerStats | null> {
    const db = getDb();

    const guests = await db
      .select()
      .from(guestIdentities)
      .where(eq(guestIdentities.id, guestIdentityId))
      .limit(1);

    if (guests.length === 0 || !guests[0]) return null;
    const guest = guests[0];

    const statsRows = await db
      .select()
      .from(playerStatistics)
      .where(eq(playerStatistics.guestIdentityId, guestIdentityId))
      .limit(1);

    const stats = statsRows.length > 0 ? statsRows[0] : null;
    const totalGames = stats?.totalGames ?? 0;
    const totalEscapes = stats?.totalEscapes ?? 0;
    const totalBhabhiResults = stats?.totalBhabhiResults ?? 0;

    const escapeRate = totalGames > 0 ? Math.round((totalEscapes / totalGames) * 1000) / 10 : 0;
    const bhabhiRate = totalGames > 0 ? Math.round((totalBhabhiResults / totalGames) * 1000) / 10 : 0;

    return {
      guestIdentityId: guest.id,
      displayName: guest.displayName,
      avatarId: guest.avatarId as AvatarId,
      totalGames,
      totalEscapes,
      totalBhabhiResults,
      totalThullasGiven: stats?.totalThullasGiven ?? 0,
      totalPilesCollected: stats?.totalPilesCollected ?? 0,
      totalCardsCollected: stats?.totalCardsCollected ?? 0,
      totalTricksPlayed: stats?.totalTricksPlayed ?? 0,
      escapeRate,
      bhabhiRate,
      updatedAt: stats?.updatedAt ? new Date(stats.updatedAt).getTime() : Date.now(),
    };
  }

  /**
   * Computes leaderboard standings for a room's active and past players.
   */
  async getRoomLeaderboard(roomCode: string): Promise<RoomLeaderboardEntry[]> {
    const db = getDb();

    // Find the room
    const rooms = await db
      .select()
      .from(gameRooms)
      .where(eq(gameRooms.roomCode, roomCode.toUpperCase()))
      .limit(1);

    if (rooms.length === 0 || !rooms[0]) return [];
    const room = rooms[0];

    // Find all players associated with this room
    const playersInRoom = await db
      .select({
        guestId: roomPlayers.guestIdentityId,
      })
      .from(roomPlayers)
      .where(eq(roomPlayers.roomId, room.id));

    const guestIds = Array.from(new Set(playersInRoom.map((p) => p.guestId)));
    if (guestIds.length === 0) return [];

    const guests = await db
      .select()
      .from(guestIdentities)
      .where(inArray(guestIdentities.id, guestIds));

    const statsList = await db
      .select()
      .from(playerStatistics)
      .where(inArray(playerStatistics.guestIdentityId, guestIds));

    const statsMap = new Map(statsList.map((s) => [s.guestIdentityId, s]));

    const entries: RoomLeaderboardEntry[] = guests.map((g) => {
      const s = statsMap.get(g.id);
      const totalGames = s?.totalGames ?? 0;
      const escapes = s?.totalEscapes ?? 0;
      const bhabhiCount = s?.totalBhabhiResults ?? 0;
      const escapeRate = totalGames > 0 ? Math.round((escapes / totalGames) * 1000) / 10 : 0;

      return {
        guestId: g.id,
        nickname: g.displayName,
        avatar: g.avatarId as AvatarId,
        gamesPlayed: totalGames,
        escapes,
        bhabhiCount,
        escapeRate,
        thullasGiven: s?.totalThullasGiven ?? 0,
      };
    });

    // Rank: highest escape rate, then most escapes, then lowest bhabhi count
    entries.sort((a, b) => {
      if (b.escapeRate !== a.escapeRate) return b.escapeRate - a.escapeRate;
      if (b.escapes !== a.escapes) return b.escapes - a.escapes;
      return a.bhabhiCount - b.bhabhiCount;
    });

    return entries;
  }
}

export const statisticsRepository = new StatisticsRepository();
