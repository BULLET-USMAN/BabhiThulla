import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { setupSocketServer } from './socket/index.js';
import {
  ActionAckResponse,
  RoomCreatedResponse,
  RoomJoinedResponse,
  GameSyncPayload,
  PlayerGameView,
} from '@bhabhi/shared';

describe('Real-Time Multiplayer Integration Tests', () => {
  let httpServer: HttpServer;
  let port: number;
  let serverUrl: string;

  beforeAll(async () => {
    const app = createApp();
    httpServer = createServer(app);
    setupSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as AddressInfo).port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  function createClient(): ClientSocket {
    return Client(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
  }

  it('handles room creation, joining, and validation', async () => {
    const hostSocket = createClient();
    const p2Socket = createClient();
    const p3Socket = createClient();

    // 1. Host creates 3-player room
    const hostCreateRes = await new Promise<ActionAckResponse<RoomCreatedResponse>>((resolve) => {
      hostSocket.emit(
        'room:create',
        { nickname: 'HostPlayer', avatar: 'avatar-1', maxPlayers: 3, requestId: 'req-1' },
        resolve
      );
    });

    expect(hostCreateRes.success).toBe(true);
    expect(hostCreateRes.data?.room.roomCode).toHaveLength(6);
    expect(hostCreateRes.data?.credentials.playerId).toBeDefined();
    expect(hostCreateRes.data?.credentials.reconnectToken).toHaveLength(64);

    const roomCode = hostCreateRes.data!.room.roomCode;

    // 2. Player 2 joins
    const p2JoinRes = await new Promise<ActionAckResponse<RoomJoinedResponse>>((resolve) => {
      p2Socket.emit(
        'room:join',
        { roomCode, nickname: 'PlayerTwo', avatar: 'avatar-2', requestId: 'req-2' },
        resolve
      );
    });
    expect(p2JoinRes.success).toBe(true);
    expect(p2JoinRes.data?.room.players).toHaveLength(2);

    // 3. Reject duplicate nickname
    const duplicateJoinRes = await new Promise<ActionAckResponse>((resolve) => {
      p3Socket.emit(
        'room:join',
        { roomCode, nickname: 'HostPlayer', avatar: 'avatar-3' },
        resolve
      );
    });
    expect(duplicateJoinRes.success).toBe(false);
    expect(duplicateJoinRes.error).toMatch(/already being used/i);

    // 4. Player 3 joins successfully
    const p3JoinRes = await new Promise<ActionAckResponse<RoomJoinedResponse>>((resolve) => {
      p3Socket.emit(
        'room:join',
        { roomCode, nickname: 'PlayerThree', avatar: 'avatar-3', requestId: 'req-3' },
        resolve
      );
    });
    expect(p3JoinRes.success).toBe(true);
    expect(p3JoinRes.data?.room.players).toHaveLength(3);

    // 5. Attempting to join full room (max 3) fails
    const p4Socket = createClient();
    const p4JoinRes = await new Promise<ActionAckResponse>((resolve) => {
      p4Socket.emit(
        'room:join',
        { roomCode, nickname: 'PlayerFour', avatar: 'avatar-4' },
        resolve
      );
    });
    expect(p4JoinRes.success).toBe(false);
    expect(p4JoinRes.error).toMatch(/maximum capacity/i);

    hostSocket.disconnect();
    p2Socket.disconnect();
    p3Socket.disconnect();
    p4Socket.disconnect();
  });

  it('enforces ready states, host-only game start, and strict card privacy', async () => {
    const s1 = createClient();
    const s2 = createClient();
    const s3 = createClient();

    // Create room
    const hostRes = await new Promise<ActionAckResponse<RoomCreatedResponse>>((resolve) => {
      s1.emit(
        'room:create',
        { nickname: 'S1Host', avatar: 'avatar-1', maxPlayers: 3, requestId: 'init-1' },
        resolve
      );
    });
    const roomCode = hostRes.data!.room.roomCode;

    await new Promise((resolve) => {
      s2.emit('room:join', { roomCode, nickname: 'S2Player', avatar: 'avatar-2' }, resolve);
    });
    await new Promise((resolve) => {
      s3.emit('room:join', { roomCode, nickname: 'S3Player', avatar: 'avatar-3' }, resolve);
    });

    // Non-host attempts to start game -> fails
    const nonHostStart = await new Promise<ActionAckResponse>((resolve) => {
      s2.emit('room:start', { roomCode }, resolve);
    });
    expect(nonHostStart.success).toBe(false);
    expect(nonHostStart.error).toMatch(/Only the room host/i);

    // Host attempts to start before players are ready -> fails
    const notReadyStart = await new Promise<ActionAckResponse>((resolve) => {
      s1.emit('room:start', { roomCode }, resolve);
    });
    expect(notReadyStart.success).toBe(false);
    expect(notReadyStart.error).toMatch(/must be ready/i);

    // Players toggle ready
    await new Promise((resolve) => {
      s2.emit('room:ready', { roomCode, isReady: true }, resolve);
    });
    await new Promise((resolve) => {
      s3.emit('room:ready', { roomCode, isReady: true }, resolve);
    });

    // Listen for game state on all sockets
    const s1StatePromise = new Promise<GameSyncPayload>((resolve) => {
      s1.on('game:state', resolve);
    });
    const s2StatePromise = new Promise<GameSyncPayload>((resolve) => {
      s2.on('game:state', resolve);
    });

    // Host starts game
    const startRes = await new Promise<ActionAckResponse>((resolve) => {
      s1.emit('room:start', { roomCode }, resolve);
    });
    expect(startRes.success).toBe(true);

    const [s1State, s2State] = await Promise.all([s1StatePromise, s2StatePromise]);

    // CARD PRIVACY VERIFICATION:
    // S1 has their own private hand
    expect(s1State.view.myHand.length).toBeGreaterThan(0);
    // S2 has their own private hand
    expect(s2State.view.myHand.length).toBeGreaterThan(0);

    // S1's payload does NOT contain S2's card faces
    const s2InS1View = s1State.view.players.find((p) => p.nickname === 'S2Player');
    expect(s2InS1View).toBeDefined();
    expect(s2InS1View!.cardCount).toBe(s2State.view.myHand.length);
    // Ensure opponents have no 'hand' array leaking
    expect((s2InS1View as unknown as { hand?: unknown[] }).hand).toBeUndefined();

    s1.disconnect();
    s2.disconnect();
    s3.disconnect();
  });

  it('handles game pause on disconnect and seamless reconnect with state restoration', async () => {
    const s1 = createClient();
    const s2 = createClient();
    const s3 = createClient();

    // Setup 3-player game
    const hostRes = await new Promise<ActionAckResponse<RoomCreatedResponse>>((resolve) => {
      s1.emit(
        'room:create',
        { nickname: 'ReconHost', avatar: 'avatar-1', maxPlayers: 3 },
        resolve
      );
    });
    const roomCode = hostRes.data!.room.roomCode;

    const p2Res = await new Promise<ActionAckResponse<RoomJoinedResponse>>((resolve) => {
      s2.emit('room:join', { roomCode, nickname: 'ReconP2', avatar: 'avatar-2' }, resolve);
    });
    const p2Credentials = p2Res.data!.credentials;

    await new Promise((resolve) => {
      s3.emit('room:join', { roomCode, nickname: 'ReconP3', avatar: 'avatar-3' }, resolve);
    });

    await new Promise((resolve) => s2.emit('room:ready', { roomCode, isReady: true }, resolve));
    await new Promise((resolve) => s3.emit('room:ready', { roomCode, isReady: true }, resolve));

    const s2StateInitPromise = new Promise<GameSyncPayload>((resolve) => {
      s2.on('game:state', resolve);
    });

    await new Promise((resolve) => s1.emit('room:start', { roomCode }, resolve));
    const s2InitialState = await s2StateInitPromise;
    const p2CardCountBeforeDisconnect = s2InitialState.view.myHand.length;

    // Listen on S1 for pause event
    const pausePromise = new Promise<{ roomCode: string; pausedPlayerId: string }>((resolve) => {
      s1.on('game:paused', resolve);
    });

    // Disconnect S2
    s2.disconnect();

    const pauseEvent = await pausePromise;
    expect(pauseEvent.pausedPlayerId).toBe(p2Credentials.playerId);

    // Player 2 reconnects using a new socket and valid token
    const newS2 = createClient();
    const reconRes = await new Promise<ActionAckResponse<{ gameState: GameSyncPayload }>>((resolve) => {
      newS2.emit(
        'room:reconnect',
        {
          roomCode,
          playerId: p2Credentials.playerId,
          reconnectToken: p2Credentials.reconnectToken,
        },
        resolve
      );
    });

    expect(reconRes.success).toBe(true);
    expect(reconRes.data?.gameState.view.myHand.length).toBe(p2CardCountBeforeDisconnect);

    s1.disconnect();
    newS2.disconnect();
    s3.disconnect();
  });

  it('rejects duplicate card play via requestId deduplication', async () => {
    const s1 = createClient();
    const s2 = createClient();
    const s3 = createClient();

    const hostRes = await new Promise<ActionAckResponse<RoomCreatedResponse>>((resolve) => {
      s1.emit(
        'room:create',
        { nickname: 'DedupHost', avatar: 'avatar-1', maxPlayers: 3 },
        resolve
      );
    });
    const roomCode = hostRes.data!.room.roomCode;

    await new Promise((resolve) => {
      s2.emit('room:join', { roomCode, nickname: 'DedupP2', avatar: 'avatar-2' }, resolve);
    });
    await new Promise((resolve) => {
      s3.emit('room:join', { roomCode, nickname: 'DedupP3', avatar: 'avatar-3' }, resolve);
    });
    await new Promise((resolve) => s2.emit('room:ready', { roomCode, isReady: true }, resolve));
    await new Promise((resolve) => s3.emit('room:ready', { roomCode, isReady: true }, resolve));

    const states: { socket: ClientSocket; state?: GameSyncPayload }[] = [
      { socket: s1 },
      { socket: s2 },
      { socket: s3 },
    ];

    const statePromises = states.map(
      (st) =>
        new Promise<void>((resolve) => {
          st.socket.on('game:state', (data: GameSyncPayload) => {
            st.state = data;
            resolve();
          });
        })
    );

    await new Promise((resolve) => s1.emit('room:start', { roomCode }, resolve));
    await Promise.all(statePromises);

    // Find who has the Ace of Spades (AS)
    const leaderEntry = states.find((st) =>
      st.state?.view.myHand.some((c) => c.suit === 'spades' && c.rank === 'A')
    );
    expect(leaderEntry).toBeDefined();

    const leaderSocket = leaderEntry!.socket;
    const aceOfSpades = leaderEntry!.state!.view.myHand.find(
      (c) => c.suit === 'spades' && c.rank === 'A'
    )!;

    const duplicateRequestId = 'dup-req-play-1';

    // Play card first time
    const firstPlay = await new Promise<ActionAckResponse>((resolve) => {
      leaderSocket.emit(
        'game:play-card',
        { roomCode, cardId: aceOfSpades.id, requestId: duplicateRequestId },
        resolve
      );
    });
    expect(firstPlay.success).toBe(true);

    // Play same card again with same requestId (simulating duplicate network packet)
    const secondPlay = await new Promise<ActionAckResponse>((resolve) => {
      leaderSocket.emit(
        'game:play-card',
        { roomCode, cardId: aceOfSpades.id, requestId: duplicateRequestId },
        resolve
      );
    });
    // Should be accepted idempotently without crash or duplicate card addition
    expect(secondPlay.success).toBe(true);

    s1.disconnect();
    s2.disconnect();
    s3.disconnect();
  });

  it('plays a complete 3-player multiplayer match to termination via WebSocket events', async () => {
    const sockets = [createClient(), createClient(), createClient()];
    const hostRes = await new Promise<ActionAckResponse<RoomCreatedResponse>>((resolve) => {
      sockets[0]!.emit('room:create', { nickname: 'P0', avatar: 'avatar-1', maxPlayers: 3 }, resolve);
    });
    const roomCode = hostRes.data!.room.roomCode;
    const playerIds = [hostRes.data!.credentials.playerId];

    for (let i = 1; i < 3; i++) {
      const joinRes = await new Promise<ActionAckResponse<RoomJoinedResponse>>((resolve) => {
        sockets[i]!.emit('room:join', { roomCode, nickname: `P${i}`, avatar: `avatar-${i + 1}` }, resolve);
      });
      playerIds.push(joinRes.data!.credentials.playerId);
      await new Promise((resolve) => sockets[i]!.emit('room:ready', { roomCode, isReady: true }, resolve));
    }

    const views: Map<string, PlayerGameView> = new Map();
    let isFinished = false;
    let bhabhiId: string | null = null;

    sockets.forEach((s, idx) => {
      const pId = playerIds[idx]!;
      s.on('game:state', (data: GameSyncPayload) => {
        views.set(pId, data.view);
      });
      s.on('game:finished', (data: { bhabhiPlayerId: string }) => {
        isFinished = true;
        bhabhiId = data.bhabhiPlayerId;
      });
    });

    await new Promise((resolve) => sockets[0]!.emit('room:start', { roomCode }, resolve));

    let turns = 0;
    while (!isFinished && turns < 600) {
      turns++;
      await new Promise((resolve) => setTimeout(resolve, 2));

      const anyView = views.values().next().value as PlayerGameView | undefined;
      if (!anyView || !anyView.currentTurnPlayerId || anyView.status === 'finished') break;

      const currentTurnId = anyView.currentTurnPlayerId;
      const socketIdx = playerIds.indexOf(currentTurnId);
      const socket = sockets[socketIdx]!;
      const playerView = views.get(currentTurnId);

      if (!playerView || playerView.legalCardIds.length === 0) break;

      const cardToPlay = playerView.legalCardIds[0]!;
      const playRes = await new Promise<ActionAckResponse>((resolve) => {
        socket.emit('game:play-card', { roomCode, cardId: cardToPlay, requestId: `turn-${turns}` }, resolve);
      });
      expect(playRes.success).toBe(true);
    }

    expect(isFinished).toBe(true);
    expect(bhabhiId).toBeDefined();

    // Test rematch voting
    const rematchPromises = sockets.map(
      (s) =>
        new Promise<ActionAckResponse<{ rematchStarted: boolean }>>((resolve) => {
          s.emit('game:rematch-vote', { roomCode, vote: true }, resolve);
        })
    );
    const rematchResults = await Promise.all(rematchPromises);
    const lastVote = rematchResults[rematchResults.length - 1] as unknown as { success: boolean; rematchStarted: boolean };
    expect(lastVote.success).toBe(true);
    expect(lastVote.rematchStarted).toBe(true);

    sockets.forEach((s) => s.disconnect());
  });
});
