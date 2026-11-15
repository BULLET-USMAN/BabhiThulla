import crypto from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from './connection.js';
import {
  gameRooms,
  roomPlayers,
  gameMatches,
  matchSnapshots,
  matchActivities,
  matchPlayerResults,
  guestIdentities,
  GameMatchRow,
  GameRoomRow,
} from './schema.js';
import { AvatarId } from '@bhabhi/shared';

export interface FinalizeMatchParams {
  matchId: string;
  bhabhiPlayerId: string;
  totalTricks: number;
  finalRevision: number;
  results: Array<{
    guestIdentityId: string;
    nickname: string;
    avatar: AvatarId;
    wasBhabhi: boolean;
    escaped: boolean;
    escapeOrder?: number;
    finalCardCount: number;
  }>;
}

export class MatchRepository {
  /**
   * Persists or updates a room state.
   */
  async upsertRoom(room: {
    id: string;
    roomCode: string;
    hostPlayerId: string;
    maxPlayers: number;
    status: string;
  }): Promise<void> {
    const db = getDb();
    const now = new Date();

    await db
      .insert(gameRooms)
      .values({
        id: room.id,
        roomCode: room.roomCode,
        hostPlayerId: room.hostPlayerId,
        maxPlayers: room.maxPlayers,
        status: room.status,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      })
      .onConflictDoUpdate({
        target: gameRooms.id,
        set: {
          status: room.status,
          updatedAt: now,
          lastActivityAt: now,
        },
      });
  }

  /**
   * Records or updates a player's seat in a room.
   */
  async upsertRoomPlayer(player: {
    id: string;
    roomId: string;
    guestIdentityId: string;
    seatIndex: number;
    isHost: boolean;
    isReady: boolean;
  }): Promise<void> {
    const db = getDb();

    // Ensure referenced guestIdentity exists
    await db
      .insert(guestIdentities)
      .values({
        id: player.guestIdentityId,
        displayName: player.guestIdentityId,
        avatarId: 'avatar-1',
        createdAt: new Date(),
        lastSeenAt: new Date(),
      })
      .onConflictDoNothing();

    await db
      .insert(roomPlayers)
      .values({
        id: player.id,
        roomId: player.roomId,
        guestIdentityId: player.guestIdentityId,
        seatIndex: player.seatIndex,
        isHost: player.isHost,
        isReady: player.isReady,
        joinedAt: new Date(),
        leftAt: null,
      })
      .onConflictDoUpdate({
        target: roomPlayers.id,
        set: {
          seatIndex: player.seatIndex,
          isHost: player.isHost,
          isReady: player.isReady,
        },
      });
  }

  /**
   * Initializes a new authoritative game match and saves its first snapshot.
   */
  async createMatch(params: {
    matchId: string;
    roomId: string;
    roomCode: string;
    initialRevision: number;
    encryptedState: string;
  }): Promise<void> {
    const db = getDb();
    const now = new Date();

    // Ensure parent gameRooms entry exists
    await this.upsertRoom({
      id: params.roomId,
      roomCode: params.roomCode,
      hostPlayerId: 'host',
      maxPlayers: 4,
      status: 'playing',
    });

    await db
      .insert(gameMatches)
      .values({
        id: params.matchId,
        roomId: params.roomId,
        roomCode: params.roomCode,
        status: 'in_progress',
        startedAt: now,
        finishedAt: null,
        bhabhiPlayerId: null,
        totalTricks: 0,
        finalRevision: params.initialRevision,
      })
      .onConflictDoUpdate({
        target: gameMatches.id,
        set: {
          finalRevision: params.initialRevision,
        },
      });

    await this.saveMatchSnapshot(params.matchId, params.initialRevision, params.encryptedState);
  }

  /**
   * Saves an encrypted match state snapshot at a given revision.
   */
  async saveMatchSnapshot(
    matchId: string,
    revision: number,
    encryptedState: string,
    roomId?: string,
    roomCode?: string
  ): Promise<void> {
    const db = getDb();
    const snapshotId = `snap_${crypto.randomBytes(12).toString('hex')}`;

    // Ensure gameMatches parent exists
    const match = await db
      .select({ id: gameMatches.id })
      .from(gameMatches)
      .where(eq(gameMatches.id, matchId))
      .limit(1);

    if (match.length === 0) {
      const parentRoomId = roomId || `room-${roomCode || 'UNKNOWN'}`;
      await this.upsertRoom({
        id: parentRoomId,
        roomCode: roomCode || 'UNKNOWN',
        hostPlayerId: 'host',
        maxPlayers: 4,
        status: 'playing',
      });

      await db
        .insert(gameMatches)
        .values({
          id: matchId,
          roomId: parentRoomId,
          roomCode: roomCode || 'UNKNOWN',
          status: 'in_progress',
          startedAt: new Date(),
          finishedAt: null,
          bhabhiPlayerId: null,
          totalTricks: 0,
          finalRevision: revision,
        })
        .onConflictDoNothing();
    }

    await db.insert(matchSnapshots).values({
      id: snapshotId,
      matchId,
      revision,
      encryptedState,
      createdAt: new Date(),
    });

    // Also update match revision
    await db
      .update(gameMatches)
      .set({ finalRevision: revision })
      .where(eq(gameMatches.id, matchId));
  }

  /**
   * Retrieves the most recent snapshot for recovery.
   */
  async getLatestMatchSnapshot(
    matchId: string
  ): Promise<{ revision: number; encryptedState: string } | null> {
    const db = getDb();
    const rows = await db
      .select({
        revision: matchSnapshots.revision,
        encryptedState: matchSnapshots.encryptedState,
      })
      .from(matchSnapshots)
      .where(eq(matchSnapshots.matchId, matchId))
      .orderBy(desc(matchSnapshots.revision))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Appends an event to the match activity audit trail.
   */
  async recordMatchActivity(
    matchId: string,
    revision: number,
    eventType: string,
    publicPayload: unknown
  ): Promise<void> {
    const db = getDb();
    const activityId = `act_${crypto.randomBytes(12).toString('hex')}`;

    await db.insert(matchActivities).values({
      id: activityId,
      matchId,
      revision,
      eventType,
      publicPayload: JSON.stringify(publicPayload),
      createdAt: new Date(),
    });
  }

  /**
   * Finalizes a completed match and records per-player outcomes idempotently.
   */
  async finalizeMatch(params: FinalizeMatchParams): Promise<void> {
    const db = getDb();
    const now = new Date();

    // Check if already finalized to prevent duplicate stat processing
    const match = await db
      .select()
      .from(gameMatches)
      .where(eq(gameMatches.id, params.matchId))
      .limit(1);

    if (match.length === 0 || !match[0] || match[0].status === 'finished') {
      return; // Idempotent exit
    }

    await db
      .update(gameMatches)
      .set({
        status: 'finished',
        finishedAt: now,
        bhabhiPlayerId: params.bhabhiPlayerId,
        totalTricks: params.totalTricks,
        finalRevision: params.finalRevision,
      })
      .where(eq(gameMatches.id, params.matchId));

    // Insert player results
    for (const res of params.results) {
      const resultId = `res_${crypto.randomBytes(12).toString('hex')}`;
      await db.insert(matchPlayerResults).values({
        id: resultId,
        matchId: params.matchId,
        guestIdentityId: res.guestIdentityId,
        nickname: res.nickname,
        avatar: res.avatar,
        wasBhabhi: res.wasBhabhi,
        escaped: res.escaped,
        escapeOrder: res.escapeOrder ?? null,
        finalCardCount: res.finalCardCount,
      });
    }
  }

  /**
   * Retrieves active matches (in_progress) for server restart recovery.
   */
  async getActiveMatches(): Promise<
    Array<{ match: GameMatchRow; room: GameRoomRow; snapshot: { revision: number; encryptedState: string } }>
  > {
    const db = getDb();
    const matches = await db
      .select()
      .from(gameMatches)
      .where(eq(gameMatches.status, 'in_progress'));

    const recovered: Array<{
      match: GameMatchRow;
      room: GameRoomRow;
      snapshot: { revision: number; encryptedState: string };
    }> = [];

    for (const match of matches) {
      const rooms = await db
        .select()
        .from(gameRooms)
        .where(eq(gameRooms.id, match.roomId))
        .limit(1);

      if (rooms.length > 0 && rooms[0]) {
        const snapshot = await this.getLatestMatchSnapshot(match.id);
        if (snapshot) {
          recovered.push({
            match,
            room: rooms[0],
            snapshot,
          });
        }
      }
    }

    return recovered;
  }

  async getMatchById(matchId: string): Promise<GameMatchRow | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(gameMatches)
      .where(eq(gameMatches.id, matchId))
      .limit(1);

    return rows[0] ?? null;
  }
}

export const matchRepository = new MatchRepository();
