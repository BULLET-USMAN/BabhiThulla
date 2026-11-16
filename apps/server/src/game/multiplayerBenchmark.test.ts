import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDatabase, closeDatabase } from '../db/connection.js';
import { GameSession } from './gameSession.js';
import { checkGameStateInvariants, getPlayerView, chooseBotMove } from '@bhabhi/shared';

describe('Phase 6 — Multiplayer Concurrency & Load Benchmark', () => {
  beforeAll(async () => {
    await initDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  interface BenchmarkResult {
    roomCount: number;
    playerCount: number;
    totalPlayers: number;
    actionsCompleted: number;
    durationMs: number;
    throughputActionsPerSec: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    memoryHeapUsedMb: number;
  }

  async function runSimultaneousRooms(roomCount: number, playersPerRoom: number): Promise<BenchmarkResult> {
    const sessions: GameSession[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    // 1. Initialize rooms and sessions
    for (let r = 0; r < roomCount; r++) {
      const roomCode = `BENCH${r.toString().padStart(3, '0')}`;
      const participants = Array.from({ length: playersPerRoom }, (_, p) => ({
        id: `bench-p-${r}-${p + 1}`,
        nickname: `Player_${p + 1}`,
        avatar: 'avatar-1' as const,
        isBot: true,
      }));

      const session = new GameSession(roomCode, {
        roomCode,
        participants,
        seed: 1000 + r * 17,
      });

      sessions.push(session);
    }

    const actionLatencies: number[] = [];
    let actionsCompleted = 0;
    const maxStepsPerRoom = 40; // Play through first 40 turns of each match concurrently
    const startTime = Date.now();

    // 2. Concurrently drive action loops across all rooms
    const roomPromises = sessions.map(async (session) => {
      let roomActions = 0;
      while (session.getGameState().status === 'playing' && roomActions < maxStepsPerRoom) {
        const state = session.getGameState();
        const currentTurnPlayerId = state.currentTurnPlayerId;
        if (!currentTurnPlayerId) break;

        const playerView = getPlayerView(state, currentTurnPlayerId);
        const cardId = chooseBotMove(playerView, 'smart');
        if (!cardId) break;

        const actionStart = performance.now();
        const res = await session.playCard(
          currentTurnPlayerId,
          cardId,
          `req-bench-${session.roomCode}-${roomActions}`
        );
        const actionDuration = performance.now() - actionStart;

        if (res.success) {
          actionLatencies.push(actionDuration);
          actionsCompleted++;
          roomActions++;
        } else {
          break;
        }
      }

      // Invariant verification on final state
      const finalState = session.getGameState();
      const violations = checkGameStateInvariants(finalState);
      expect(violations).toHaveLength(0);
    });

    await Promise.all(roomPromises);
    const totalDurationMs = Date.now() - startTime;
    const memoryAfter = process.memoryUsage().heapUsed;

    actionLatencies.sort((a, b) => a - b);
    const avgLatency =
      actionLatencies.length > 0
        ? actionLatencies.reduce((a, b) => a + b, 0) / actionLatencies.length
        : 0;
    const p95Latency =
      actionLatencies.length > 0
        ? actionLatencies[Math.floor(actionLatencies.length * 0.95)] || 0
        : 0;

    return {
      roomCount,
      playerCount: playersPerRoom,
      totalPlayers: roomCount * playersPerRoom,
      actionsCompleted,
      durationMs: totalDurationMs,
      throughputActionsPerSec: Math.round((actionsCompleted / (totalDurationMs / 1000)) * 10) / 10,
      avgLatencyMs: Math.round(avgLatency * 100) / 100,
      p95LatencyMs: Math.round(p95Latency * 100) / 100,
      memoryHeapUsedMb: Math.round(((memoryAfter - memoryBefore) / 1024 / 1024) * 100) / 100,
    };
  }

  it('Scenario 1: 5 simultaneous active rooms (20 concurrent players)', async () => {
    const result = await runSimultaneousRooms(5, 4);
    console.log('[PERF BENCHMARK 5 ROOMS]', result);

    expect(result.actionsCompleted).toBeGreaterThanOrEqual(150);
    expect(result.avgLatencyMs).toBeLessThan(100);
    expect(result.p95LatencyMs).toBeLessThan(150);
  });

  it('Scenario 2: 10 simultaneous active rooms (40 concurrent players)', async () => {
    const result = await runSimultaneousRooms(10, 4);
    console.log('[PERF BENCHMARK 10 ROOMS]', result);

    expect(result.actionsCompleted).toBeGreaterThanOrEqual(300);
    expect(result.avgLatencyMs).toBeLessThan(120);
    expect(result.p95LatencyMs).toBeLessThan(200);
  });

  it('Scenario 3: 20 simultaneous active rooms (80 concurrent players)', async () => {
    const result = await runSimultaneousRooms(20, 4);
    console.log('[PERF BENCHMARK 20 ROOMS]', result);

    expect(result.actionsCompleted).toBeGreaterThanOrEqual(600);
    expect(result.avgLatencyMs).toBeLessThan(150);
    expect(result.throughputActionsPerSec).toBeGreaterThan(50);
  });
});
