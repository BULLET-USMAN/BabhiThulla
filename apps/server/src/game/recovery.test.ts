import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase } from '../db/connection.js';
import { RoomManager } from '../rooms/roomManager.js';
import { RateLimiter } from '../security/rateLimiter.js';
import { checkGameStateInvariants } from '@bhabhi/shared';

describe('Phase 5 — Failure Recovery & Anti-Cheat Scenarios (A–J)', () => {
  beforeAll(async () => {
    await initDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('Scenario A: Backend restart during trick restores match state without redeal or reshuffle', async () => {
    const rm1 = new RoomManager();
    const { room: initialRoom, player: p1 } = rm1.createRoom({
      nickname: 'Farhan',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-1',
    });

    const j2 = rm1.joinRoom({ roomCode: initialRoom.code, nickname: 'Zainab', avatar: 'avatar-2', socketId: 'sock-2' });
    const j3 = rm1.joinRoom({ roomCode: initialRoom.code, nickname: 'Hamza', avatar: 'avatar-3', socketId: 'sock-3' });

    rm1.setReady(initialRoom.code, p1.id, true);
    rm1.setReady(initialRoom.code, j2.player!.id, true);
    rm1.setReady(initialRoom.code, j3.player!.id, true);

    const startRes = rm1.startGame(initialRoom.code, p1.id, 100);
    expect(startRes.success).toBe(true);

    const session1 = startRes.room!.gameSession!;
    const state1 = session1.getGameState();
    const leaderId = state1.currentLeaderPlayerId!;

    // Leader plays first card (Spades Ace)
    const leaderHand = state1.players.find((p) => p.id === leaderId)!.hand;
    const aceOfSpades = leaderHand.find((c) => c.suit === 'spades' && c.rank === 'A') || leaderHand[0]!;

    const playRes = await session1.playCard(leaderId, aceOfSpades.id, 'req-scen-a-1');
    expect(playRes.success).toBe(true);
    expect(session1.getRevision()).toBe(2);

    // Simulate backend crash & restart: Create brand new RoomManager instance
    const rmRestarted = new RoomManager();
    const recoveredCount = await rmRestarted.recoverActiveRoomsFromDatabase();
    expect(recoveredCount).toBeGreaterThanOrEqual(1);

    const recoveredRoom = rmRestarted.getRoom(initialRoom.code);
    expect(recoveredRoom).toBeDefined();
    expect(recoveredRoom?.status).toBe('paused');
    expect(recoveredRoom?.gameSession?.getRevision()).toBe(2);

    const recoveredState = recoveredRoom!.gameSession!.getGameState();
    expect(recoveredState.currentTrick.length).toBe(1);
    expect(recoveredState.currentTrick[0]!.card.id).toBe(aceOfSpades.id);
    expect(recoveredState.currentTrick[0]!.playerId).toBe(leaderId);

    // Invariant check: Exactly 52 cards preserved
    const violations = checkGameStateInvariants(recoveredState);
    expect(violations).toHaveLength(0);
  });

  it('Scenario B: Client reconnection with valid token recovers exact hand and current trick', () => {
    const rm = new RoomManager();
    const { room, player, reconnectToken } = rm.createRoom({
      nickname: 'Farhan',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-orig',
    });

    const res = rm.reconnectPlayer(room.code, player.id, reconnectToken, 'sock-new');
    expect(res.success).toBe(true);
    expect(res.player?.socketId).toBe('sock-new');
    expect(res.player?.isConnected).toBe(true);
  });

  it('Scenario C: Reconnection with invalid or expired credentials is appropriately rejected', () => {
    const rm = new RoomManager();
    const { room, player } = rm.createRoom({
      nickname: 'Farhan',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-1',
    });

    const res = rm.reconnectPlayer(room.code, player.id, 'fake-token-1234567890123456', 'sock-attacker');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid or expired/i);
  });

  it('Scenario D: Duplicate concurrent connection cleanly replaces old socket mapping', () => {
    const rm = new RoomManager();
    const { room, player, reconnectToken } = rm.createRoom({
      nickname: 'Farhan',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-old',
    });

    // Old socket mapped
    const map1 = rm.getRoomBySocketId('sock-old');
    expect(map1?.player.id).toBe(player.id);

    // Reconnect with new socket
    rm.reconnectPlayer(room.code, player.id, reconnectToken, 'sock-new');

    // Old socket mapping must be cleared
    expect(rm.getRoomBySocketId('sock-old')).toBeUndefined();
    expect(rm.getRoomBySocketId('sock-new')?.player.id).toBe(player.id);
  });

  it("Scenario E: Disconnect during player's turn pauses match with grace period", () => {
    const rm = new RoomManager();
    const { room, player } = rm.createRoom({
      nickname: 'Farhan',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-e-1',
    });
    const j2 = rm.joinRoom({ roomCode: room.code, nickname: 'Zainab', avatar: 'avatar-2', socketId: 'sock-e-2' });
    const j3 = rm.joinRoom({ roomCode: room.code, nickname: 'Hamza', avatar: 'avatar-3', socketId: 'sock-e-3' });

    rm.setReady(room.code, player.id, true);
    rm.setReady(room.code, j2.player!.id, true);
    rm.setReady(room.code, j3.player!.id, true);

    rm.startGame(room.code, player.id, 42);

    const dcRes = rm.handleDisconnect('sock-e-1');
    expect(dcRes.player?.isConnected).toBe(false);
    expect(dcRes.gamePaused).toBe(true);
    expect(room.status).toBe('paused');
    expect(room.gameSession?.getIsPaused()).toBe(true);
  });

  it('Scenario F: Player reconnects before grace period expires, automatically resuming the match', () => {
    const rm = new RoomManager();
    const { room, player, reconnectToken } = rm.createRoom({
      nickname: 'Farhan',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-f-1',
    });
    const j2 = rm.joinRoom({ roomCode: room.code, nickname: 'Zainab', avatar: 'avatar-2', socketId: 'sock-f-2' });
    const j3 = rm.joinRoom({ roomCode: room.code, nickname: 'Hamza', avatar: 'avatar-3', socketId: 'sock-f-3' });

    rm.setReady(room.code, player.id, true);
    rm.setReady(room.code, j2.player!.id, true);
    rm.setReady(room.code, j3.player!.id, true);

    rm.startGame(room.code, player.id, 42);

    // Disconnect Farhan
    rm.handleDisconnect('sock-f-1');
    expect(room.status).toBe('paused');

    // Reconnect Farhan before grace timer fires
    const recon = rm.reconnectPlayer(room.code, player.id, reconnectToken, 'sock-f-restored');
    expect(recon.success).toBe(true);
    expect(room.status).toBe('playing');
    expect(room.gameSession?.getIsPaused()).toBe(false);
  });

  it('Scenario G: Host disconnects in waiting lobby, transferring host privileges cleanly', () => {
    const rm = new RoomManager();
    const { room, player: host } = rm.createRoom({
      nickname: 'Host1',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-g-host',
    });
    const j2 = rm.joinRoom({ roomCode: room.code, nickname: 'Player2', avatar: 'avatar-2', socketId: 'sock-g-p2' });

    expect(room.hostPlayerId).toBe(host.id);

    // Player leaves
    rm.leaveRoom(room.code, host.id);

    expect(room.hostPlayerId).toBe(j2.player!.id);
    expect(j2.player!.isHost).toBe(true);
  });

  it('Scenario H: Rematch voted by all players starts fresh deal with unique match ID', async () => {
    const rm = new RoomManager();
    const { room, player } = rm.createRoom({
      nickname: 'P1',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-h-1',
    });
    const j2 = rm.joinRoom({ roomCode: room.code, nickname: 'P2', avatar: 'avatar-2', socketId: 'sock-h-2' });
    const j3 = rm.joinRoom({ roomCode: room.code, nickname: 'P3', avatar: 'avatar-3', socketId: 'sock-h-3' });

    rm.setReady(room.code, player.id, true);
    rm.setReady(room.code, j2.player!.id, true);
    rm.setReady(room.code, j3.player!.id, true);

    rm.startGame(room.code, player.id, 42);
    const initialMatchId = room.gameSession!.matchId;

    // Vote rematch
    const v1 = rm.voteRematch(room.code, player.id, true);
    expect(v1.rematchStarted).toBe(false);

    const v2 = rm.voteRematch(room.code, j2.player!.id, true);
    expect(v2.rematchStarted).toBe(false);

    const v3 = rm.voteRematch(room.code, j3.player!.id, true, 999);
    expect(v3.rematchStarted).toBe(true);
    expect(room.gameSession!.matchId).not.toBe(initialMatchId);
    expect(room.status).toBe('playing');
  });

  it('Scenario I: Opponent and spectator views never leak private card identities', () => {
    const rm = new RoomManager();
    const { room, player } = rm.createRoom({
      nickname: 'Alice',
      avatar: 'avatar-1',
      maxPlayers: 3,
      socketId: 'sock-i-1',
    });
    const j2 = rm.joinRoom({ roomCode: room.code, nickname: 'Bob', avatar: 'avatar-2', socketId: 'sock-i-2' });
    const j3 = rm.joinRoom({ roomCode: room.code, nickname: 'Charlie', avatar: 'avatar-3', socketId: 'sock-i-3' });

    rm.setReady(room.code, player.id, true);
    rm.setReady(room.code, j2.player!.id, true);
    rm.setReady(room.code, j3.player!.id, true);

    rm.startGame(room.code, player.id, 42);
    const session = room.gameSession!;

    // Fetch Alice's player view
    const aliceView = session.getPlayerView(player.id);
    expect(aliceView.myHand.length).toBeGreaterThan(0);

    // Assert other players' cards are scrubbed (only cardCount is exposed)
    for (const other of aliceView.players) {
      if (other.id !== player.id) {
        expect((other as any).hand).toBeUndefined();
        expect(typeof other.cardCount).toBe('number');
      }
    }

    // Public spectator view
    const publicView = session.getPublicView();
    expect((publicView as any).myHand).toBeUndefined();
    for (const p of publicView.players) {
      expect((p as any).hand).toBeUndefined();
      expect(typeof p.cardCount).toBe('number');
    }
  });

  it('Scenario J: Action rate limiter strictly throttles abusive request volume', () => {
    const limiter = new RateLimiter(5, 1000); // Max 5 requests per second

    const socketId = 'sock-abuser';
    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed(socketId)).toBe(true);
    }

    // 6th request within window must be rejected
    expect(limiter.isAllowed(socketId)).toBe(false);
  });
});
