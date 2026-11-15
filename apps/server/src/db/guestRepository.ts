import crypto from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { getDb } from './connection.js';
import { guestIdentities, guestSessions, GuestIdentityRow } from './schema.js';
import { AvatarId } from '@bhabhi/shared';

const SESSION_SECRET = process.env.SESSION_SECRET || 'bhabhi-thulla-insecure-secret-change-in-prod';
const SESSION_EXPIRY_DAYS = 30;

function hashToken(token: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(token)
    .digest('hex');
}

export class GuestRepository {
  /**
   * Registers a new guest identity or retrieves existing by guestId, issuing a secure session credential.
   */
  async registerGuest(
    displayName: string,
    avatarId: AvatarId,
    existingGuestId?: string
  ): Promise<{ guest: GuestIdentityRow; sessionToken: string }> {
    const db = getDb();
    let guest: GuestIdentityRow | undefined;

    if (existingGuestId) {
      const rows = await db
        .select()
        .from(guestIdentities)
        .where(eq(guestIdentities.id, existingGuestId))
        .limit(1);

      if (rows.length > 0 && rows[0]) {
        guest = rows[0];
        // Update display name or avatar if provided
        await db
          .update(guestIdentities)
          .set({
            displayName,
            avatarId,
            lastSeenAt: new Date(),
          })
          .where(eq(guestIdentities.id, guest.id));
        guest.displayName = displayName;
        guest.avatarId = avatarId;
      }
    }

    if (!guest) {
      const guestId = `guest_${crypto.randomBytes(12).toString('hex')}`;
      const now = new Date();
      await db.insert(guestIdentities).values({
        id: guestId,
        displayName,
        avatarId,
        createdAt: now,
        lastSeenAt: now,
      });

      guest = {
        id: guestId,
        displayName,
        avatarId,
        createdAt: now,
        lastSeenAt: now,
      };
    }

    // Generate cryptographically secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const credentialHash = hashToken(sessionToken);
    const sessionId = `sess_${crypto.randomBytes(12).toString('hex')}`;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(guestSessions).values({
      id: sessionId,
      guestIdentityId: guest.id,
      credentialHash,
      createdAt: new Date(),
      expiresAt,
      revokedAt: null,
    });

    return { guest, sessionToken };
  }

  /**
   * Validates guest session token against database.
   */
  async validateSession(
    guestId: string,
    sessionToken: string
  ): Promise<{ valid: boolean; guest?: GuestIdentityRow }> {
    if (!guestId || !sessionToken) return { valid: false };

    const db = getDb();
    const hash = hashToken(sessionToken);
    const now = new Date();

    const sessions = await db
      .select()
      .from(guestSessions)
      .where(
        and(
          eq(guestSessions.guestIdentityId, guestId),
          eq(guestSessions.credentialHash, hash),
          gt(guestSessions.expiresAt, now),
          isNull(guestSessions.revokedAt)
        )
      )
      .limit(1);

    if (sessions.length === 0) {
      return { valid: false };
    }

    const guests = await db
      .select()
      .from(guestIdentities)
      .where(eq(guestIdentities.id, guestId))
      .limit(1);

    if (guests.length === 0) {
      return { valid: false };
    }

    // Update lastSeenAt
    await db
      .update(guestIdentities)
      .set({ lastSeenAt: new Date() })
      .where(eq(guestIdentities.id, guestId));

    return { valid: true, guest: guests[0] };
  }

  /**
   * Retrieves guest identity by ID.
   */
  async getGuestById(guestId: string): Promise<GuestIdentityRow | null> {
    const db = getDb();
    const rows = await db
      .select()
      .from(guestIdentities)
      .where(eq(guestIdentities.id, guestId))
      .limit(1);

    return rows[0] ?? null;
  }
}

export const guestRepository = new GuestRepository();
