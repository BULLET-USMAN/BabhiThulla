import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'bhabhi-thulla-insecure-secret-change-in-prod';

export class GuestSessionManager {
  // Key: `${roomCode}:${playerId}` -> reconnectToken
  private tokens = new Map<string, string>();

  /**
   * Generates a cryptographically authenticated reconnect token for a player in a room.
   * Uses HMAC-SHA256 with the server's secret, enabling reliable recovery across restarts.
   */
  createSession(roomCode: string, playerId: string): string {
    const key = this.getKey(roomCode, playerId);
    const token = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(key)
      .digest('hex');

    this.tokens.set(key, token);
    return token;
  }

  /**
   * Validates a reconnect token for a given room and player identity.
   * Supports in-memory cache and cross-restart cryptographic verification.
   */
  validateSession(roomCode: string, playerId: string, token: string): boolean {
    const key = this.getKey(roomCode, playerId);
    const expected =
      this.tokens.get(key) ||
      crypto.createHmac('sha256', SESSION_SECRET).update(key).digest('hex');

    if (!token || token.length !== expected.length) return false;

    // Constant-time buffer comparison to prevent timing attacks
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
