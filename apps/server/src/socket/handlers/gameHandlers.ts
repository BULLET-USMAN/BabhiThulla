import { Server, Socket } from 'socket.io';
import { PlayCardSchema, RematchVoteSchema } from '../../security/validation.js';
import { roomManager } from '../../rooms/roomManager.js';
import { logger } from '../../utils/logger.js';
import { RateLimiter } from '../../security/rateLimiter.js';

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  rateLimiter: RateLimiter
) {
  // PLAY CARD
  socket.on('game:play-card', (payload: unknown, ack?: (res: unknown) => void) => {
    if (!rateLimiter.isAllowed(socket.id)) {
      ack?.({ success: false, error: 'Action rate limit reached. Slow down.' });
      return;
    }

    const parsed = PlayCardSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid card move.' });
      return;
    }

    const { roomCode, cardId, requestId } = parsed.data;
    const mapping = roomManager.getRoomBySocketId(socket.id);

    if (!mapping || mapping.room.code !== roomCode) {
      ack?.({ success: false, error: 'Unauthorized game action.' });
      return;
    }

    const room = mapping.room;
    if (!room.gameSession) {
      ack?.({ success: false, error: 'No active match found in room.' });
      return;
    }

    const playerId = mapping.player.id;
    const result = room.gameSession.playCard(playerId, cardId, requestId);

    if (!result.success) {
      ack?.({ success: false, requestId, error: result.error });
      return;
    }

    ack?.({ success: true, requestId });

    const roomChannel = `room:${room.code}`;
    const session = room.gameSession;
    const revision = session.getRevision();

    // Broadcast individual events
    if (result.events) {
      for (const ev of result.events) {
        if (ev.type === 'THULLA_OCCURRED') {
          io.to(roomChannel).emit('game:thulla', {
            roomCode: room.code,
            playerId: ev.playerId,
            card: ev.card,
          });
        } else if (ev.type === 'TRICK_RESOLVED' || ev.type === 'PILE_COLLECTED') {
          io.to(roomChannel).emit('game:trick-resolved', {
            roomCode: room.code,
            result: session.getGameState().lastTrickResult,
          });
        } else if (ev.type === 'PLAYER_ESCAPED') {
          io.to(roomChannel).emit('game:player-escaped', {
            roomCode: room.code,
            playerId: ev.playerId,
          });
        } else if (ev.type === 'BHABHI_DECLARED') {
          io.to(roomChannel).emit('game:finished', {
            roomCode: room.code,
            bhabhiPlayerId: session.getGameState().bhabhiPlayerId,
            escapedPlayerIds: session.getGameState().escapedPlayerIds,
          });
        }
      }
    }

    // STRICT CARD PRIVACY:
    // Broadcast updated player-specific view to each connected player's socket
    for (const member of room.members) {
      if (member.isConnected && member.socketId) {
        const playerView = session.getPlayerView(member.id);
        io.to(member.socketId).emit('game:state', {
          roomCode: room.code,
          revision,
          view: playerView,
          isPaused: session.getIsPaused(),
          pauseReason: session.getPauseReason(),
        });
      }
    }
  });

  // REMATCH VOTE
  socket.on('game:rematch-vote', (payload: unknown, ack?: (res: unknown) => void) => {
    const parsed = RematchVoteSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid input.' });
      return;
    }

    const { roomCode, vote } = parsed.data;
    const mapping = roomManager.getRoomBySocketId(socket.id);

    if (!mapping || mapping.room.code !== roomCode) {
      ack?.({ success: false, error: 'Unauthorized action.' });
      return;
    }

    const result = roomManager.voteRematch(roomCode, mapping.player.id, vote);
    if (!result.success || !result.room || !result.room.gameSession) {
      ack?.({ success: false, error: result.error || 'Failed to register rematch vote.' });
      return;
    }

    ack?.({ success: true, rematchStarted: result.rematchStarted });

    const roomChannel = `room:${roomCode}`;
    const approvals = result.room.members.filter((m) => m.rematchVoted === true).map((m) => m.id);

    io.to(roomChannel).emit('game:rematch-status', {
      roomCode,
      approvals,
      totalRequired: result.room.members.filter((m) => m.isConnected).length,
      allApproved: result.rematchStarted,
    });

    if (result.rematchStarted) {
      logger.info(`Rematch started in room ${roomCode}`);
      io.to(roomChannel).emit('game:started', {
        roomCode,
        firstLeaderId: result.room.gameSession.getGameState().currentLeaderPlayerId,
      });

      // Send fresh private hands to each connected player
      for (const member of result.room.members) {
        if (member.isConnected && member.socketId) {
          const playerView = result.room.gameSession.getPlayerView(member.id);
          io.to(member.socketId).emit('game:state', {
            roomCode,
            revision: result.room.gameSession.getRevision(),
            view: playerView,
            isPaused: false,
          });
        }
      }
    }
  });

  // REQUEST STATE (SYNC)
  socket.on('game:request-state', (_payload: unknown, ack?: (res: unknown) => void) => {
    const mapping = roomManager.getRoomBySocketId(socket.id);
    if (!mapping || !mapping.room.gameSession) {
      ack?.({ success: false, error: 'No active game session found.' });
      return;
    }

    const playerView = mapping.room.gameSession.getPlayerView(mapping.player.id);
    const syncData = {
      roomCode: mapping.room.code,
      revision: mapping.room.gameSession.getRevision(),
      view: playerView,
      isPaused: mapping.room.gameSession.getIsPaused(),
      pauseReason: mapping.room.gameSession.getPauseReason(),
    };

    ack?.({ success: true, data: syncData });
    socket.emit('game:state', syncData);
  });
}
