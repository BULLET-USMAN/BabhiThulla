import {
  pgTable,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. Guest Identities
export const guestIdentities = pgTable('guest_identities', {
  id: varchar('id', { length: 64 }).primaryKey(),
  displayName: varchar('display_name', { length: 50 }).notNull(),
  avatarId: varchar('avatar_id', { length: 30 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. Guest Sessions
export const guestSessions = pgTable(
  'guest_sessions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    guestIdentityId: varchar('guest_identity_id', { length: 64 })
      .notNull()
      .references(() => guestIdentities.id, { onDelete: 'cascade' }),
    credentialHash: varchar('credential_hash', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_guest_sessions_guest').on(table.guestIdentityId),
    index('idx_guest_sessions_hash').on(table.credentialHash),
  ]
);

// 3. Game Rooms
export const gameRooms = pgTable(
  'game_rooms',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    roomCode: varchar('room_code', { length: 10 }).notNull(),
    hostPlayerId: varchar('host_player_id', { length: 64 }).notNull(),
    maxPlayers: integer('max_players').notNull().default(4),
    status: varchar('status', { length: 20 }).notNull().default('waiting'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_game_rooms_code').on(table.roomCode),
    index('idx_game_rooms_status').on(table.status),
  ]
);

// 4. Room Players
export const roomPlayers = pgTable(
  'room_players',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    roomId: varchar('room_id', { length: 64 })
      .notNull()
      .references(() => gameRooms.id, { onDelete: 'cascade' }),
    guestIdentityId: varchar('guest_identity_id', { length: 64 })
      .notNull()
      .references(() => guestIdentities.id, { onDelete: 'cascade' }),
    seatIndex: integer('seat_index').notNull(),
    isHost: boolean('is_host').notNull().default(false),
    isReady: boolean('is_ready').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_room_players_room').on(table.roomId),
    index('idx_room_players_guest').on(table.guestIdentityId),
  ]
);

// 5. Game Matches
export const gameMatches = pgTable(
  'game_matches',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    roomId: varchar('room_id', { length: 64 })
      .notNull()
      .references(() => gameRooms.id, { onDelete: 'cascade' }),
    roomCode: varchar('room_code', { length: 10 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('in_progress'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    bhabhiPlayerId: varchar('bhabhi_player_id', { length: 64 }),
    totalTricks: integer('total_tricks').notNull().default(0),
    finalRevision: integer('final_revision').notNull().default(1),
  },
  (table) => [
    index('idx_game_matches_room').on(table.roomId),
    index('idx_game_matches_status').on(table.status),
    index('idx_game_matches_room_code').on(table.roomCode),
  ]
);

// 6. Match Snapshots
export const matchSnapshots = pgTable(
  'match_snapshots',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    matchId: varchar('match_id', { length: 64 })
      .notNull()
      .references(() => gameMatches.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    encryptedState: text('encrypted_state').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_match_snapshots_match_rev').on(table.matchId, table.revision),
  ]
);

// 7. Match Player Results
export const matchPlayerResults = pgTable(
  'match_player_results',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    matchId: varchar('match_id', { length: 64 })
      .notNull()
      .references(() => gameMatches.id, { onDelete: 'cascade' }),
    guestIdentityId: varchar('guest_identity_id', { length: 64 })
      .notNull()
      .references(() => guestIdentities.id, { onDelete: 'cascade' }),
    nickname: varchar('nickname', { length: 50 }).notNull(),
    avatar: varchar('avatar', { length: 30 }).notNull(),
    wasBhabhi: boolean('was_bhabhi').notNull().default(false),
    escaped: boolean('escaped').notNull().default(false),
    escapeOrder: integer('escape_order'),
    finalCardCount: integer('final_card_count').notNull().default(0),
  },
  (table) => [
    index('idx_match_player_results_match').on(table.matchId),
    index('idx_match_player_results_guest').on(table.guestIdentityId),
  ]
);

// 8. Player Statistics
export const playerStatistics = pgTable('player_statistics', {
  guestIdentityId: varchar('guest_identity_id', { length: 64 })
    .primaryKey()
    .references(() => guestIdentities.id, { onDelete: 'cascade' }),
  totalGames: integer('total_games').notNull().default(0),
  totalEscapes: integer('total_escapes').notNull().default(0),
  totalBhabhiResults: integer('total_bhabhi_results').notNull().default(0),
  totalThullasGiven: integer('total_thullas_given').notNull().default(0),
  totalPilesCollected: integer('total_piles_collected').notNull().default(0),
  totalCardsCollected: integer('total_cards_collected').notNull().default(0),
  totalTricksPlayed: integer('total_tricks_played').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 9. Match Activities
export const matchActivities = pgTable(
  'match_activities',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    matchId: varchar('match_id', { length: 64 })
      .notNull()
      .references(() => gameMatches.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    publicPayload: text('public_payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_match_activities_match').on(table.matchId),
  ]
);

export type GuestIdentityRow = typeof guestIdentities.$inferSelect;
export type GuestSessionRow = typeof guestSessions.$inferSelect;
export type GameRoomRow = typeof gameRooms.$inferSelect;
export type RoomPlayerRow = typeof roomPlayers.$inferSelect;
export type GameMatchRow = typeof gameMatches.$inferSelect;
export type MatchSnapshotRow = typeof matchSnapshots.$inferSelect;
export type MatchPlayerResultRow = typeof matchPlayerResults.$inferSelect;
export type PlayerStatisticsRow = typeof playerStatistics.$inferSelect;
export type MatchActivityRow = typeof matchActivities.$inferSelect;
