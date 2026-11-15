import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits standard for AES-GCM
const DEFAULT_DEV_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getEncryptionKey(overrideKey?: Buffer | string): Buffer {
  const rawKey = overrideKey || process.env.GAME_STATE_ENCRYPTION_KEY || DEFAULT_DEV_KEY;
  if (Buffer.isBuffer(rawKey)) {
    if (rawKey.length === 32) return rawKey;
    return crypto.createHash('sha256').update(rawKey).digest();
  }
  if (typeof rawKey === 'string') {
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, 'hex');
    }
    return crypto.createHash('sha256').update(rawKey, 'utf8').digest();
  }
  return crypto.createHash('sha256').update(DEFAULT_DEV_KEY, 'utf8').digest();
}

export interface EncryptedPayload {
  iv: string; // hex
  tag: string; // hex
  data: string; // hex
}

/**
 * Encrypts arbitrary game state data with AES-256-GCM.
 * Preserves strict card privacy at rest.
 */
export function encryptSnapshot(data: unknown, overrideKey?: Buffer | string): string {
  const key = getEncryptionKey(overrideKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonString = JSON.stringify(data);
  let encrypted = cipher.update(jsonString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  const payload: EncryptedPayload = {
    iv: iv.toString('hex'),
    tag,
    data: encrypted,
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts AES-256-GCM encrypted snapshot data and validates authentication tag.
 * Throws an error if payload has been tampered with or corrupted.
 */
export function decryptSnapshot<T = unknown>(
  encryptedJson: string,
  overrideKey?: Buffer | string
): T {
  const key = getEncryptionKey(overrideKey);
  const payload: EncryptedPayload = JSON.parse(encryptedJson);

  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted) as T;
}
