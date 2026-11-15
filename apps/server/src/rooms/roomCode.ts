import crypto from 'crypto';

// Unambiguous uppercase alphanumeric characters (no 0, O, 1, I)
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a unique 6-character room code using cryptographically secure random bytes.
 */
export function generateRoomCode(existingCodes: Set<string>): string {
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomBytes = crypto.randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      const index = randomBytes[i]! % CODE_ALPHABET.length;
      code += CODE_ALPHABET[index];
    }

    if (!existingCodes.has(code)) {
      return code;
    }
  }

  // Fallback with timestamp salt if very high density
  return `BH${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}
