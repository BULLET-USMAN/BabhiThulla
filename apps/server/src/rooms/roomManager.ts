import { AvatarId } from '@bhabhi/shared';
import { ServerRoom, ServerRoomMember } from './roomTypes.js';
import { generateRoomCode } from './roomCode.js';
import { sessionManager } from '../sessions/guestSessionManager.js';
import { GameSession } from '../game/gameSession.js';
import { logger } from '../utils/logger.js';

export interface CreateRoomParams {
  nickname: string;
  avatar: AvatarId;
  maxPlayers?: number;
  socketId: string;
}

export interface JoinRoomParams {
  roomCode: string;
  nickname: string;
  avatar: AvatarId;
  socketId: string;
}

export class RoomManager {
  private rooms = new Map<string, ServerRoom>(); // key: roomCode uppercase
  private socketToRoom = new Map<string, { roomCode: string; playerId: string }>();

  // Configurable timeouts
  public readonly disconnectGracePeriodMs = 120000; // 120 seconds
  public readonly idleRoomTimeoutMs = 30 * 60 * 1000; // 30 minutes

  getRoom(roomCode: string): ServerRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getRoomBySocketId(socketId: string): { room: ServerRoom; player: ServerRoomMember } | undefined {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return undefined;

    const room = this.rooms.get(mapping.roomCode);
    if (!room) return undefined;

    const player = room.members.find((m) => m.id === mapping.playerId);
    if (!player) return undefined;

    return { room, player };
  }

  createRoom({
    nickname,
    avatar,
    maxPlayers = 4,
    socketId,
  }: CreateRoomParams): { room: ServerRoom; player: ServerRoomMember; reconnectToken: string } {
    const existingCodes = new Set(this.rooms.keys());
    const code = generateRoomCode(existingCodes);
    const roomId = `room-${Date.now()}-${code}`;
    const playerId = `p-${Date.now()}-1`;

    const hostMember: ServerRoomMember = {
      id: playerId,
      nickname,
      avatar,
      socketId,
      isHost: true,
      isReady: true, // Host is ready by default
      isConnected: true,
      seatIndex: 0,
    };

    const room: ServerRoom = {
      id: roomId,
      code,
      hostPlayerId: playerId,
      maxPlayers: Math.min(6, Math.max(3, maxPlayers)),
      status: 'waiting',
      members: [hostMember],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      gameSession: null,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socketId, { roomCode: code, playerId });

    const reconnectToken = sessionManager.createSession(code, playerId);

    logger.info(`Room created: ${code} by ${nickname}`, {
      roomCode: code,
      hostId: playerId,
      maxPlayers: room.maxPlayers,
    });

    return { room, player: hostMember, reconnectToken };
  }

  joinRoom({
    roomCode,
    nickname,
    avatar,
    socketId,
  }: JoinRoomParams): {
    success: boolean;
    room?: ServerRoom;
    player?: ServerRoomMember;
    reconnectToken?: string;
    error?: string;
  } {
    const cleanCode = roomCode.toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room does not exist.' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Match has already started in this room.' };
    }

    if (room.members.length >= room.maxPlayers) {
      return { success: false, error: 'Room has reached maximum capacity.' };
    }

    // Check duplicate nickname in room
    const isNameTaken = room.members.some(
      (m) => m.nickname.toLowerCase() === nickname.toLowerCase()
    );
    if (isNameTaken) {
      return {
        success: false,
        error: 'This nickname is already being used in this room.',
      };
    }

    const playerId = `p-${Date.now()}-${room.members.length + 1}`;
    const seatIndex = room.members.length;

    const newMember: ServerRoomMember = {
      id: playerId,
      nickname,
      avatar,
      socketId,
      isHost: false,
      isReady: false,
      isConnected: true,
      seatIndex,
    };

    room.members.push(newMember);
    room.lastActivityAt = Date.now();
    this.socketToRoom.set(socketId, { roomCode: cleanCode, playerId });

    const reconnectToken = sessionManager.createSession(cleanCode, playerId);

    logger.info(`Player ${nickname} joined room ${cleanCode}`, {
      roomCode: cleanCode,
      playerId,
      seatIndex,
    });

    return { success: true, room, player: newMember, reconnectToken };
  }

  reconnectPlayer(
    roomCode: string,
    playerId: string,
    reconnectToken: string,
    newSocketId: string
  ): {
    success: boolean;
    room?: ServerRoom;
    player?: ServerRoomMember;
    error?: string;
  } {
    const cleanCode = roomCode.toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room does not exist or has expired.' };
    }

    const isValidToken = sessionManager.validateSession(cleanCode, playerId, reconnectToken);
    if (!isValidToken) {
      return { success: false, error: 'Invalid or expired reconnect credentials.' };
    }

    const player = room.members.find((m) => m.id === playerId);
    if (!player) {
      return { success: false, error: 'Player identity not found in this room.' };
    }

    // Clear previous socket mapping if different
    if (player.socketId && player.socketId !== newSocketId) {
      this.socketToRoom.delete(player.socketId);
    }

    // Clear disconnect grace timer if running
    if (player.disconnectGraceTimer) {
      clearTimeout(player.disconnectGraceTimer);
      player.disconnectGraceTimer = undefined;
    }

    player.isConnected = true;
    player.socketId = newSocketId;
    room.lastActivityAt = Date.now();
    this.socketToRoom.set(newSocketId, { roomCode: cleanCode, playerId });

    // Check if match was paused due to this player's disconnection
    if (room.gameSession && room.gameSession.getIsPaused()) {
      const allActiveConnected = room.members
        .filter((m) => {
          const gamePlayer = room.gameSession?.getGameState().players.find((p) => p.id === m.id);
          return gamePlayer && !gamePlayer.hasEscaped;
        })
        .every((m) => m.isConnected);

      if (allActiveConnected) {
        room.gameSession.resume();
        room.status = 'playing';
      }
    }

    logger.info(`Player ${player.nickname} reconnected to room ${cleanCode}`, {
      roomCode: cleanCode,
      playerId,
      socketId: newSocketId,
    });

    return { success: true, room, player };
  }

  setReady(
    roomCode: string,
    playerId: string,
    isReady: boolean
  ): { success: boolean; room?: ServerRoom; error?: string } {
    const cleanCode = roomCode.toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return { success: false, error: 'Room does not exist.' };
    if (room.status !== 'waiting') return { success: false, error: 'Game already active.' };

    const player = room.members.find((m) => m.id === playerId);
    if (!player) return { success: false, error: 'Player not found in room.' };

    player.isReady = isReady;
    room.lastActivityAt = Date.now();
    return { success: true, room };
  }

  startGame(
    roomCode: string,
    hostPlayerId: string,
    seed?: number
  ): { success: boolean; room?: ServerRoom; error?: string } {
    const cleanCode = roomCode.toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) return { success: false, error: 'Room does not exist.' };
    if (room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the room host can start the game.' };
    }
    if (room.status !== 'waiting') {
      return { success: false, error: 'Game has already started.' };
    }

    const connectedMembers = room.members.filter((m) => m.isConnected);
    if (connectedMembers.length < 3) {
      return { success: false, error: 'At least 3 connected players are required to start.' };
    }
    if (connectedMembers.length > room.maxPlayers) {
      return { success: false, error: `Exceeded room capacity of ${room.maxPlayers}.` };
    }

    const allReady = connectedMembers.every((m) => m.isReady);
    if (!allReady) {
      return { success: false, error: 'All players must be ready before starting.' };
    }

    const participants = connectedMembers.map((m) => ({
      id: m.id,
      nickname: m.nickname,
      avatar: m.avatar,
      isBot: false,
    }));

    room.gameSession = new GameSession(cleanCode, participants, seed);
    room.status = 'playing';
    room.lastActivityAt = Date.now();

    logger.info(`Match started in room ${cleanCode} with ${participants.length} players`);
    return { success: true, room };
  }

  voteRematch(
    roomCode: string,
    playerId: string,
    vote: boolean,
    seed?: number
  ): {
    success: boolean;
    room?: ServerRoom;
    rematchStarted: boolean;
    error?: string;
  } {
    const cleanCode = roomCode.toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room || !room.gameSession) {
      return { success: false, rematchStarted: false, error: 'No completed match found.' };
    }

    const player = room.members.find((m) => m.id === playerId);
    if (!player) {
      return { success: false, rematchStarted: false, error: 'Player not found in room.' };
    }

    player.rematchVoted = vote;
    room.lastActivityAt = Date.now();

    // Check if all connected members voted yes
    const connectedMembers = room.members.filter((m) => m.isConnected);
    const allApproved = connectedMembers.every((m) => m.rematchVoted === true);

    if (allApproved && connectedMembers.length >= 3) {
      // Clear rematch votes and start fresh deal
      for (const m of room.members) {
        m.rematchVoted = undefined;
      }
      room.gameSession.restartMatch(seed);
      room.status = 'playing';
      return { success: true, room, rematchStarted: true };
    }

    return { success: true, room, rematchStarted: false };
  }

  handleDisconnect(
    socketId: string,
    onGraceExpired?: (roomCode: string, playerId: string) => void
  ): {
    player?: ServerRoomMember;
    room?: ServerRoom;
    isHost: boolean;
    gamePaused: boolean;
  } {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return { isHost: false, gamePaused: false };

    const { roomCode, playerId } = mapping;
    this.socketToRoom.delete(socketId);

    const room = this.rooms.get(roomCode);
    if (!room) return { isHost: false, gamePaused: false };

    const player = room.members.find((m) => m.id === playerId);
    if (!player) return { isHost: false, gamePaused: false };

    player.isConnected = false;
    let gamePaused = false;

    // Pause game if match is active and player has not escaped
    if (room.status === 'playing' && room.gameSession) {
      const gamePlayer = room.gameSession.getGameState().players.find((p) => p.id === playerId);
      if (gamePlayer && !gamePlayer.hasEscaped) {
        room.gameSession.pause(`Waiting for ${player.nickname} to reconnect...`);
        room.status = 'paused';
        gamePaused = true;
      }
    }

    // Start 120-second reconnection grace timer
    player.disconnectGraceTimer = setTimeout(() => {
      logger.info(`Reconnection grace expired for player ${player.nickname} in room ${roomCode}`);
      player.disconnectGraceTimer = undefined;

      // If host disconnected in waiting lobby, transfer host to next connected player
      if (player.isHost && room.status === 'waiting') {
        const nextConnected = room.members.find((m) => m.isConnected && m.id !== player.id);
        if (nextConnected) {
          player.isHost = false;
          nextConnected.isHost = true;
          room.hostPlayerId = nextConnected.id;
          logger.info(`Host transferred to ${nextConnected.nickname} in room ${roomCode}`);
        }
      }

      if (onGraceExpired) {
        onGraceExpired(roomCode, playerId);
      }
    }, this.disconnectGracePeriodMs);

    return {
      player,
      room,
      isHost: player.isHost,
      gamePaused,
    };
  }

  leaveRoom(
    roomCode: string,
    playerId: string
  ): {
    success: boolean;
    room?: ServerRoom;
    closed: boolean;
    newHostId?: string;
    error?: string;
  } {
    const cleanCode = roomCode.toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return { success: false, closed: false, error: 'Room not found.' };

    const index = room.members.findIndex((m) => m.id === playerId);
    if (index === -1) return { success: false, closed: false, error: 'Player not in room.' };

    const leavingPlayer = room.members[index]!;
    if (leavingPlayer.disconnectGraceTimer) {
      clearTimeout(leavingPlayer.disconnectGraceTimer);
    }
    this.socketToRoom.delete(leavingPlayer.socketId);
    sessionManager.removeSession(cleanCode, playerId);

    room.members.splice(index, 1);
    room.lastActivityAt = Date.now();

    // If room is now empty, close and delete it
    if (room.members.length === 0) {
      this.rooms.delete(cleanCode);
      sessionManager.clearRoomSessions(cleanCode);
      logger.info(`Room ${cleanCode} closed (empty).`);
      return { success: true, closed: true };
    }

    let newHostId: string | undefined;
    // If leaving player was host, transfer host to first remaining connected player
    if (leavingPlayer.isHost) {
      const nextHost = room.members.find((m) => m.isConnected) || room.members[0]!;
      nextHost.isHost = true;
      room.hostPlayerId = nextHost.id;
      newHostId = nextHost.id;
      logger.info(`Host transferred to ${nextHost.nickname} in room ${cleanCode}`);
    }

    return { success: true, room, closed: false, newHostId };
  }

  cleanupInactiveRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivityAt > this.idleRoomTimeoutMs) {
        logger.info(`Cleaning up inactive room ${code}`);
        for (const m of room.members) {
          if (m.disconnectGraceTimer) clearTimeout(m.disconnectGraceTimer);
          this.socketToRoom.delete(m.socketId);
        }
        sessionManager.clearRoomSessions(code);
        this.rooms.delete(code);
      }
    }
  }
}

export const roomManager = new RoomManager();
