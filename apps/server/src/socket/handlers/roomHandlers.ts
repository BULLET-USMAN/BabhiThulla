import { Server, Socket } from 'socket.io';
import {
  CreateRoomSchema,
  JoinRoomSchema,
  ToggleReadySchema,
  StartGameSchema,
  LeaveRoomSchema,
} from '../../security/validation.js';
import { roomManager } from '../../rooms/roomManager.js';
import { toRoomSummary } from '../../rooms/roomTypes.js';
import { logger } from '../../utils/logger.js';
import { RateLimiter } from '../../security/rateLimiter.js';

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  rateLimiter: RateLimiter
) {
  // CREATE ROOM
  socket.on('room:create', (payload: unknown, ack?: (res: unknown) => void) => {
    if (!rateLimiter.isAllowed(socket.id)) {
      ack?.({ success: false, error: 'Too many requests. Please slow down.' });
      return;
    }

    const parsed = CreateRoomSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid input.' });
      return;
    }

    try {
      const { nickname, avatar, maxPlayers, requestId } = parsed.data;
      const { room, player, reconnectToken } = roomManager.createRoom({
        nickname,
        avatar,
        maxPlayers,
        socketId: socket.id,
      });

      const roomChannel = `room:${room.code}`;
      socket.join(roomChannel);

      const summary = toRoomSummary(room);
      const response = {
        success: true,
        requestId,
        data: {
          room: summary,
          credentials: {
            playerId: player.id,
            reconnectToken,
            roomCode: room.code,
          },
        },
      };

      ack?.(response);
      socket.emit('room:created', response.data);
    } catch (err: unknown) {
      logger.error('Failed to create room', { err });
      ack?.({ success: false, error: 'Failed to create room.' });
    }
  });

  // JOIN ROOM
  socket.on('room:join', (payload: unknown, ack?: (res: unknown) => void) => {
    if (!rateLimiter.isAllowed(socket.id)) {
      ack?.({ success: false, error: 'Too many requests. Please slow down.' });
      return;
    }

    const parsed = JoinRoomSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: parsed.error.issues[0]?.message || 'Invalid input.' });
      return;
    }

    try {
      const { roomCode, nickname, avatar, requestId } = parsed.data;
      const result = roomManager.joinRoom({
        roomCode,
        nickname,
        avatar,
        socketId: socket.id,
      });

      if (!result.success || !result.room || !result.player || !result.reconnectToken) {
        ack?.({ success: false, error: result.error || 'Failed to join room.' });
        return;
      }

      const roomChannel = `room:${result.room.code}`;
      socket.join(roomChannel);

      const summary = toRoomSummary(result.room);
      const responseData = {
        room: summary,
        credentials: {
          playerId: result.player.id,
          reconnectToken: result.reconnectToken,
          roomCode: result.room.code,
        },
      };

      ack?.({ success: true, requestId, data: responseData });
      socket.emit('room:joined', responseData);

      // Broadcast update to all other room members
      socket.to(roomChannel).emit('player:joined', {
        player: {
          id: result.player.id,
          nickname: result.player.nickname,
          avatar: result.player.avatar,
          isHost: result.player.isHost,
          isReady: result.player.isReady,
          isConnected: true,
          seatIndex: result.player.seatIndex,
        },
      });
      io.to(roomChannel).emit('room:updated', { room: summary });
    } catch (err: unknown) {
      logger.error('Failed to join room', { err });
      ack?.({ success: false, error: 'Failed to join room.' });
    }
  });

  // TOGGLE READY
  socket.on('room:ready', (payload: unknown, ack?: (res: unknown) => void) => {
    const parsed = ToggleReadySchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid input.' });
      return;
    }

    const mapping = roomManager.getRoomBySocketId(socket.id);
    if (!mapping || mapping.room.code !== parsed.data.roomCode) {
      ack?.({ success: false, error: 'Unauthorized room action.' });
      return;
    }

    const result = roomManager.setReady(
      parsed.data.roomCode,
      mapping.player.id,
      parsed.data.isReady
    );

    if (!result.success || !result.room) {
      ack?.({ success: false, error: result.error || 'Failed to update ready state.' });
      return;
    }

    const summary = toRoomSummary(result.room);
    ack?.({ success: true, data: { room: summary } });
    io.to(`room:${result.room.code}`).emit('room:updated', { room: summary });
  });

  // START GAME (HOST ONLY)
  socket.on('room:start', (payload: unknown, ack?: (res: unknown) => void) => {
    const parsed = StartGameSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid input.' });
      return;
    }

    const mapping = roomManager.getRoomBySocketId(socket.id);
    if (!mapping || mapping.room.code !== parsed.data.roomCode) {
      ack?.({ success: false, error: 'Unauthorized room action.' });
      return;
    }

    const result = roomManager.startGame(parsed.data.roomCode, mapping.player.id);
    if (!result.success || !result.room || !result.room.gameSession) {
      ack?.({ success: false, error: result.error || 'Failed to start game.' });
      return;
    }

    ack?.({ success: true });

    const roomChannel = `room:${result.room.code}`;
    const summary = toRoomSummary(result.room);
    io.to(roomChannel).emit('room:updated', { room: summary });
    io.to(roomChannel).emit('game:started', {
      roomCode: result.room.code,
      firstLeaderId: result.room.gameSession.getGameState().currentLeaderPlayerId,
    });

    // PRIVACY ENFORCEMENT:
    // Send each connected player their own personalized player view
    for (const member of result.room.members) {
      if (member.isConnected && member.socketId) {
        const playerView = result.room.gameSession.getPlayerView(member.id);
        io.to(member.socketId).emit('game:state', {
          roomCode: result.room.code,
          revision: result.room.gameSession.getRevision(),
          view: playerView,
          isPaused: false,
        });
      }
    }
  });

  // LEAVE ROOM
  socket.on('room:leave', (payload: unknown, ack?: (res: unknown) => void) => {
    const parsed = LeaveRoomSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid input.' });
      return;
    }

    const mapping = roomManager.getRoomBySocketId(socket.id);
    if (!mapping || mapping.room.code !== parsed.data.roomCode) {
      ack?.({ success: true });
      return;
    }

    const roomChannel = `room:${parsed.data.roomCode}`;
    socket.leave(roomChannel);

    const result = roomManager.leaveRoom(parsed.data.roomCode, mapping.player.id);
    ack?.({ success: true });

    if (result.closed) {
      io.to(roomChannel).emit('room:closed', { reason: 'Room closed by host or empty.' });
    } else if (result.room) {
      const summary = toRoomSummary(result.room);
      io.to(roomChannel).emit('player:left', { playerId: mapping.player.id });
      io.to(roomChannel).emit('room:updated', { room: summary });
    }
  });
}
