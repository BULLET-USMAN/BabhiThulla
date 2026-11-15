import crypto from 'crypto';

export class GuestSessionManager {
  // Key: `${roomCode}:${playerId}` -> reconnectToken
  private tokens = new Map<string, string>();

  /**
   * Generates and stores a cryptographically secure opaque reconnect token for a player in a room.
   */
  createSession(roomCode: string, playerId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const key = this.getKey(roomCode, playerId);
    this.tokens.set(key, token);
    return token;
  }

  /**
   * Validates a reconnect token for a given room and player identity.
   */
  validateSession(roomCode: string, playerId: string, token: string): boolean {
    const key = this.getKey(roomCode, playerId);
    const expected = this.tokens.get(key);
    if (!expected) return false;

    // Constant-time buffer comparison to prevent timing attacks
    if (token.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  }

  /**
   * Invalidates a session token when a player voluntarily leaves or room closes.
   */
  removeSession(roomCode: string, playerId: string) {
    this.tokens.delete(this.getKey(roomCode, playerId));
  }

  /**
   * Cleans up all sessions associated with an expired room.
   */
  clearRoomSessions(roomCode: string) {
    const prefix = `${roomCode.toUpperCase()}:`;
    for (const key of this.tokens.keys()) {
      if (key.startsWith(prefix)) {
        this.tokens.delete(key);
      }
    }
  }

  private getKey(roomCode: string, playerId: string): string {
    return `${roomCode.toUpperCase()}:${playerId}`;
  }
}

export const sessionManager = new GuestSessionManager();
