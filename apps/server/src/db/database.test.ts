import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase } from './connection.js';
import { guestRepository } from './guestRepository.js';
import { matchRepository } from './matchRepository.js';
import { statisticsRepository } from './statisticsRepository.js';
import { matchHistoryRepository } from './matchHistoryRepository.js';
import { encryptSnapshot, decryptSnapshot } from '../security/encryption.js';
import { createGame, stepGame, checkGameStateInvariants } from '@bhabhi/shared';

describe('Phase 5 — Database Persistence, Encryption & Statistics Suite', () => {
  beforeAll(async () => {
    // Force in-memory database with schema migration execution
    await initDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('1. AES-256-GCM Cryptographic Snapshot Security', () => {
    it('encrypts and decrypts state accurately', () => {
      const sampleState = {
        gameId: 'test-game-1',
        turn: 4,
        cards: ['spades-A', 'hearts-10', 'diamonds-K'],
      };

      const encrypted = encryptSnapshot(sampleState);
      expect(encrypted).toContain('"iv"');
      expect(encrypted).toContain('"tag"');
      expect(encrypted).toContain('"data"');

      const decrypted = decryptSnapshot<typeof sampleState>(encrypted);
      expect(decrypted).toEqual(sampleState);
    });

    it('rejects tampered ciphertext with an authentication error', () => {
      const sampleState = { sensitiveSecret: 'player-hand-ace-of-spades' };
      const encrypted = encryptSnapshot(sampleState);
      const parsed = JSON.parse(encrypted);

      // Flip the last byte of data
      parsed.data = parsed.data.slice(0, -2) + (parsed.data.endsWith('00') ? 'ff' : '00');
      const tampered = JSON.stringify(parsed);

      expect(() => decryptSnapshot(tampered)).toThrow();
    });
  });

  describe('2. Guest Identity & Session Authentication', () => {
    it('creates guest identity and validates cryptographically hashed session token', async () => {
      const { guest, sessionToken } = await guestRepository.registerGuest('UsmanPlayer', 'avatar-1');
      expect(guest.id).toMatch(/^guest_/);
      expect(guest.displayName).toBe('UsmanPlayer');
      expect(sessionToken.length).toBe(64);

      const check = await guestRepository.validateSession(guest.id, sessionToken);
      expect(check.valid).toBe(true);
      expect(check.guest?.displayName).toBe('UsmanPlayer');
    });

    it('rejects forged session tokens and non-existent guest IDs', async () => {
      const forged = await guestRepository.validateSession('guest_fake123', 'invalid-token-string');
      expect(forged.valid).toBe(false);

      const { guest } = await guestRepository.registerGuest('LegitUser', 'avatar-2');
      const fakeTokenCheck = await guestRepository.validateSession(guest.id, '0000000000000000000000000000000000000000000000000000000000000000');
      expect(fakeTokenCheck.valid).toBe(false);
    });
  });

  describe('3. Match Snapshots & 52-Card Invariant Conservation', () => {
    it('persists match and preserves 52-card conservation across state revisions', async () => {
      const p1 = 'guest_p1';
      const p2 = 'guest_p2';
      const p3 = 'guest_p3';

      const initialGame = createGame({
        gameId: 'match-audit-1',
        players: [
          { id: p1, nickname: 'Alice', avatar: 'avatar-1', isBot: false },
          { id: p2, nickname: 'Bob', avatar: 'avatar-2', isBot: false },
          { id: p3, nickname: 'Charlie', avatar: 'avatar-3', isBot: false },
        ],
        seed: 42,
      });

      // Assert 52 cards conserved in game engine
      const violations = checkGameStateInvariants(initialGame);
      expect(violations).toHaveLength(0);

      const roomId = 'room_persist_test';
      const roomCode = 'PERS01';
      const matchId = 'match_persist_test';

      await matchRepository.upsertRoom({
        id: roomId,
        roomCode,
        hostPlayerId: p1,
        maxPlayers: 3,
        status: 'playing',
      });

      const encryptedInitial = encryptSnapshot(initialGame);
      await matchRepository.createMatch({
        matchId,
        roomId,
        roomCode,
        initialRevision: 1,
        encryptedState: encryptedInitial,
      });

      // Play a card
      const leader = initialGame.currentLeaderPlayerId!;
      const leaderHand = initialGame.players.find((p) => p.id === leader)!.hand;
      const firstCard = leaderHand.find((c) => c.suit === 'spades' && c.rank === 'A') || leaderHand[0]!;

      const step1 = stepGame(initialGame, {
        type: 'PLAY_CARD',
        playerId: leader,
        cardId: firstCard.id,
      });
      expect(step1.success).toBe(true);

      const encryptedRev2 = encryptSnapshot(step1.state);
      await matchRepository.saveMatchSnapshot(matchId, 2, encryptedRev2);

      // Verify retrieval of latest snapshot
      const latest = await matchRepository.getLatestMatchSnapshot(matchId);
      expect(latest).not.toBeNull();
      expect(latest?.revision).toBe(2);

      const restoredState = decryptSnapshot(latest!.encryptedState);
      const restoredViolations = checkGameStateInvariants(restoredState as any);
      expect(restoredViolations).toHaveLength(0);
    });
  });

  describe('4. Authoritative Statistics & Room Leaderboard', () => {
    it('atomically records match outcomes, calculates rates, and generates leaderboard', async () => {
      const g1 = (await guestRepository.registerGuest('PlayerAlpha', 'avatar-1')).guest.id;
      const g2 = (await guestRepository.registerGuest('PlayerBeta', 'avatar-2')).guest.id;
      const g3 = (await guestRepository.registerGuest('PlayerGamma', 'avatar-3')).guest.id;

      const roomCode = 'LEAD01';
      const roomId = 'room_lead_1';

      await matchRepository.upsertRoom({
        id: roomId,
        roomCode,
        hostPlayerId: g1,
        maxPlayers: 3,
        status: 'playing',
      });

      await matchRepository.upsertRoomPlayer({
        id: 'rp1',
        roomId,
        guestIdentityId: g1,
        seatIndex: 0,
        isHost: true,
        isReady: true,
      });
      await matchRepository.upsertRoomPlayer({
        id: 'rp2',
        roomId,
        guestIdentityId: g2,
        seatIndex: 1,
        isHost: false,
        isReady: true,
      });
      await matchRepository.upsertRoomPlayer({
        id: 'rp3',
        roomId,
        guestIdentityId: g3,
        seatIndex: 2,
        isHost: false,
        isReady: true,
      });

      const matchId = 'match_stats_test_1';
      await matchRepository.createMatch({
        matchId,
        roomId,
        roomCode,
        initialRevision: 1,
        encryptedState: encryptSnapshot({ dummy: true }),
      });

      // Finalize match: Alpha escaped 1st, Beta escaped 2nd, Gamma became Bhabhi
      await matchRepository.finalizeMatch({
        matchId,
        bhabhiPlayerId: g3,
        totalTricks: 18,
        finalRevision: 25,
        results: [
          { guestIdentityId: g1, nickname: 'PlayerAlpha', avatar: 'avatar-1', escaped: true, escapeOrder: 1, wasBhabhi: false, finalCardCount: 0 },
          { guestIdentityId: g2, nickname: 'PlayerBeta', avatar: 'avatar-2', escaped: true, escapeOrder: 2, wasBhabhi: false, finalCardCount: 0 },
          { guestIdentityId: g3, nickname: 'PlayerGamma', avatar: 'avatar-3', escaped: false, wasBhabhi: true, finalCardCount: 4 },
        ],
      });

      // Update player statistics
      await statisticsRepository.recordMatchStats([
        { guestIdentityId: g1, escaped: true, wasBhabhi: false, thullasGiven: 2, pilesCollected: 0, cardsCollected: 0, tricksPlayed: 18 },
        { guestIdentityId: g2, escaped: true, wasBhabhi: false, thullasGiven: 1, pilesCollected: 1, cardsCollected: 4, tricksPlayed: 18 },
        { guestIdentityId: g3, escaped: false, wasBhabhi: true, thullasGiven: 0, pilesCollected: 2, cardsCollected: 12, tricksPlayed: 18 },
      ]);

      // Check stats
      const statsAlpha = await statisticsRepository.getPlayerStats(g1);
      expect(statsAlpha).not.toBeNull();
      expect(statsAlpha?.totalGames).toBe(1);
      expect(statsAlpha?.totalEscapes).toBe(1);
      expect(statsAlpha?.escapeRate).toBe(100);
      expect(statsAlpha?.bhabhiRate).toBe(0);
      expect(statsAlpha?.totalThullasGiven).toBe(2);

      const statsGamma = await statisticsRepository.getPlayerStats(g3);
      expect(statsGamma).not.toBeNull();
      expect(statsGamma?.totalGames).toBe(1);
      expect(statsGamma?.totalBhabhiResults).toBe(1);
      expect(statsGamma?.escapeRate).toBe(0);
      expect(statsGamma?.bhabhiRate).toBe(100);

      // Check Room Leaderboard
      const leaderboard = await statisticsRepository.getRoomLeaderboard(roomCode);
      expect(leaderboard.length).toBe(3);
      expect(leaderboard[0]!.guestId).toBe(g1); // Ranked 1st by escapeRate
      expect(leaderboard[2]!.guestId).toBe(g3); // Ranked last (Bhabhi)

      // Check Match History
      const history = await matchHistoryRepository.getMatchHistory({ roomCode });
      expect(history.length).toBe(1);
      expect(history[0]!.matchId).toBe(matchId);
      expect(history[0]!.bhabhiPlayerId).toBe(g3);
      expect(history[0]!.players.length).toBe(3);
    });
  });
});
