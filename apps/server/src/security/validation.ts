import { z } from 'zod';

export const NicknameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Nickname must be at least 2 characters.' })
  .max(20, { message: 'Nickname cannot exceed 20 characters.' })
  .regex(/^[\p{L}\p{N} _-]+$/u, {
    message: 'Nickname contains invalid characters.',
  });

export const AvatarSchema = z.enum([
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
  'avatar-7',
  'avatar-8',
]);

export const RoomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(6, { message: 'Room code must be exactly 6 characters.' })
  .regex(/^[A-Z0-9]{6}$/, { message: 'Room code must be alphanumeric.' });

export const CreateRoomSchema = z.object({
  nickname: NicknameSchema,
  avatar: AvatarSchema,
  maxPlayers: z.number().int().min(3).max(6).optional().default(4),
  requestId: z.string().optional(),
});

export const JoinRoomSchema = z.object({
  roomCode: RoomCodeSchema,
  nickname: NicknameSchema,
  avatar: AvatarSchema,
  requestId: z.string().optional(),
});

export const ReconnectSchema = z.object({
  roomCode: RoomCodeSchema,
  playerId: z.string().min(1),
  reconnectToken: z.string().min(16),
});

export const ToggleReadySchema = z.object({
  roomCode: RoomCodeSchema,
  isReady: z.boolean(),
});

export const StartGameSchema = z.object({
  roomCode: RoomCodeSchema,
});

export const PlayCardSchema = z.object({
  roomCode: RoomCodeSchema,
  cardId: z.string().regex(/^[a-z]+-[0-9A-Z]+$/, { message: 'Invalid card ID format.' }),
  requestId: z.string().min(1),
});

export const RematchVoteSchema = z.object({
  roomCode: RoomCodeSchema,
  vote: z.boolean(),
});

export const LeaveRoomSchema = z.object({
  roomCode: RoomCodeSchema,
});
