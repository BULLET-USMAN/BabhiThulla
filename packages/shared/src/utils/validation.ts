export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a player's guest nickname.
 * Must be 2-20 characters long after trimming, containing alphanumeric characters,
 * spaces, underscores, or hyphens.
 */
export function validateNickname(nickname: string): ValidationResult {
  const trimmed = nickname.trim();
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Nickname must be at least 2 characters.',
    };
  }
  if (trimmed.length > 20) {
    return {
      valid: false,
      error: 'Nickname cannot exceed 20 characters.',
    };
  }
  // Allow letters, digits, spaces, hyphens, and underscores
  const validPattern = /^[\p{L}\p{N} _-]+$/u;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Nickname contains invalid characters. Use letters, numbers, spaces, or hyphens.',
    };
  }

  return { valid: true };
}

/**
 * Validates a 6-character alphanumeric room code.
 */
export function validateRoomCode(code: string): ValidationResult {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length !== 6) {
    return {
      valid: false,
      error: 'Room code must be exactly 6 characters.',
    };
  }
  if (!/^[A-Z0-9]{6}$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Room code must consist only of letters and numbers.',
    };
  }
  return { valid: true };
}

/**
 * Generates a mock 6-character alphanumeric room code.
 */
export function generateMockRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omits easily confused O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
