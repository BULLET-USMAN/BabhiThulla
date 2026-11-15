import { Server, Socket } from 'socket.io';
import { ALLOWED_EMOTES, ALLOWED_QUICK_CHATS } from '@bhabhi/shared';
import { SendEmoteSchema, SendQuickChatSchema } from '../../security/validation.js';
import { roomManager } from '../../rooms/roomManager.js';
import { RateLimiter } from '../../security/rateLimiter.js';

export function registerReactionHandlers(
  io: Server,
  socket: Socket,
  reactionRateLimiter: RateLimiter
) {
  // SEND EMOTE
  socket.on('room:emote', (payload: unknown, ack?: (res: unknown) => void) => {
    if (!reactionRateLimiter.isAllowed(socket.id)) {
      ack?.({ success: false, error: 'You are reacting too quickly. Please wait a moment.' });
      return;
    }

    const parsed = SendEmoteSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid emote reaction.' });
      return;
    }

    const { roomCode, emoteId } = parsed.data;
    const mapping = roomManager.getRoomBySocketId(socket.id);

    if (!mapping || mapping.room.code !== roomCode) {
      ack?.({ success: false, error: 'Unauthorized reaction.' });
      return;
    }

    const emoteConfig = ALLOWED_EMOTES.find((e) => e.id === emoteId);
    if (!emoteConfig) {
      ack?.({ success: false, error: 'Unrecognized emote.' });
      return;
    }

    const roomChannel = `room:${roomCode}`;
    const broadcastPayload = {
      roomCode,
      playerId: mapping.player.id,
      emoteId,
      symbol: emoteConfig.symbol,
      timestamp: Date.now(),
    };

    io.to(roomChannel).emit('player:emote', broadcastPayload);
    ack?.({ success: true, data: broadcastPayload });
  });

  // SEND QUICK CHAT
  socket.on('room:quick-chat', (payload: unknown, ack?: (res: unknown) => void) => {
    if (!reactionRateLimiter.isAllowed(socket.id)) {
      ack?.({ success: false, error: 'You are sending messages too quickly. Please slow down.' });
      return;
    }

    const parsed = SendQuickChatSchema.safeParse(payload);
    if (!parsed.success) {
      ack?.({ success: false, error: 'Invalid quick chat message.' });
      return;
    }

    const { roomCode, messageId } = parsed.data;
    const mapping = roomManager.getRoomBySocketId(socket.id);

    if (!mapping || mapping.room.code !== roomCode) {
      ack?.({ success: false, error: 'Unauthorized message.' });
      return;
    }

    const chatConfig = ALLOWED_QUICK_CHATS.find((c) => c.id === messageId);
    if (!chatConfig) {
      ack?.({ success: false, error: 'Unrecognized quick chat message.' });
      return;
    }

    const roomChannel = `room:${roomCode}`;
    const broadcastPayload = {
      roomCode,
      playerId: mapping.player.id,
      messageId,
      text: chatConfig.text,
      timestamp: Date.now(),
    };

    io.to(roomChannel).emit('player:quick-chat', broadcastPayload);
    ack?.({ success: true, data: broadcastPayload });
  });
}
