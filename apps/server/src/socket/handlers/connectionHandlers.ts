import { Server, Socket } from 'socket.io';
import { ReconnectSchema } from '../../security/validation.js';
import { roomManager } from '../../rooms/roomManager.js';
import { toRoomSummary } from '../../rooms/roomTypes.js';
import { logger } from '../../utils/logger.js';

export function registerConnectionHandlers(
  io: Server,
  socket: Socket
) {
  // RECONNECT TO ROOM
  socket.on('room:reconnect', (payload: unknown, ack?: (res: unknown) => void) => {
    const parsed = ReconnectSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid reconnect request format.' });
      return;
    }

    const { roomCode, playerId, reconnectToken } = parsed.data;
    const result = roomManager.reconnectPlayer(roomCode, playerId, reconnectToken, socket.id);

    if (!result.success || !result.room || !result.player) {
      ack?.({ success: false, error: result.error || 'Failed to reconnect.' });
      return;
    }

    const room = result.room;
    const roomChannel = `room:${room.code}`;
    socket.join(roomChannel);

    const summary = toRoomSummary(room);
    const session = room.gameSession;

    let playerView = undefined;
    if (session) {
      playerView = session.getPlayerView(playerId);
    }

    const responseData = {
      room: summary,
      gameState: playerView
        ? {
            roomCode: room.code,
            revision: session!.getRevision(),
            view: playerView,
            isPaused: session!.getIsPaused(),
            pauseReason: session!.getPauseReason(),
          }
        : undefined,
    };

    ack?.({ success: true, data: responseData });

    // Notify room of player return
    io.to(roomChannel).emit('player:reconnected', {
      playerId,
      nickname: result.player.nickname,
    });
    io.to(roomChannel).emit('room:updated', { room: summary });

    // If game was resumed because all active players are reconnected
    if (session && !session.getIsPaused() && room.status === 'playing') {
      io.to(roomChannel).emit('game:resumed', { roomCode: room.code });
      // Broadcast updated view to everyone
      for (const m of room.members) {
        if (m.isConnected && m.socketId) {
          io.to(m.socketId).emit('game:state', {
            roomCode: room.code,
            revision: session.getRevision(),
            view: session.getPlayerView(m.id),
            isPaused: false,
          });
        }
      }
    } else if (session && playerView) {
      // Send the reconnected player their state
      socket.emit('game:state', {
        roomCode: room.code,
        revision: session.getRevision(),
        view: playerView,
        isPaused: session.getIsPaused(),
        pauseReason: session.getPauseReason(),
      });
    }
  });

  // DISCONNECT
  socket.on('disconnect', (reason: string) => {
    logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);

    const result = roomManager.handleDisconnect(socket.id, (roomCode, playerId) => {
      // On grace period expiration
      const room = roomManager.getRoom(roomCode);
      if (room) {
        const roomChannel = `room:${room.code}`;
        io.to(roomChannel).emit('player:grace-expired', { playerId });
        io.to(roomChannel).emit('room:updated', { room: toRoomSummary(room) });
      }
    });

    if (result.room && result.player) {
      const roomChannel = `room:${result.room.code}`;
      io.to(roomChannel).emit('player:disconnected', {
        playerId: result.player.id,
        nickname: result.player.nickname,
      });

      if (result.gamePaused) {
        io.to(roomChannel).emit('game:paused', {
          roomCode: result.room.code,
          pausedPlayerId: result.player.id,
          gracePeriodRemainingMs: roomManager.disconnectGracePeriodMs,
          reason: `Waiting for ${result.player.nickname} to reconnect...`,
        });
      }

      io.to(roomChannel).emit('room:updated', { room: toRoomSummary(result.room) });
    }
  });
}
