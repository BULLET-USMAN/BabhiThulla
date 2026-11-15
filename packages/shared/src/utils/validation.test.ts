import { describe, expect, it } from 'vitest';
import {
  validateNickname,
  validateRoomCode,
  generateMockRoomCode,
} from './validation.js';

describe('Validation Utilities', () => {
  describe('validateNickname', () => {
    it('accepts valid nicknames', () => {
      expect(validateNickname('Ali').valid).toBe(true);
      expect(validateNickname('Bhabhi_King').valid).toBe(true);
      expect(validateNickname('Card-Master 99').valid).toBe(true);
    });

    it('rejects short nicknames (<2 chars)', () => {
      const res = validateNickname('A');
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejects whitespace-only nicknames', () => {
      const res = validateNickname('   ');
      expect(res.valid).toBe(false);
    });

    it('rejects overly long nicknames (>20 chars)', () => {
      const res = validateNickname('ThisIsAVeryLongNicknameExceedingLimit');
      expect(res.valid).toBe(false);
    });

    it('rejects invalid special characters', () => {
      const res = validateNickname('Player<script>');
      expect(res.valid).toBe(false);
    });
  });

  describe('validateRoomCode', () => {
    it('accepts valid 6-char alphanumeric code', () => {
      expect(validateRoomCode('AB12CD').valid).toBe(true);
      expect(validateRoomCode('99ZZ44').valid).toBe(true);
    });

    it('rejects non-6-character codes', () => {
      expect(validateRoomCode('ABC').valid).toBe(false);
      expect(validateRoomCode('ABCDEFG').valid).toBe(false);
    });

    it('rejects special characters in room code', () => {
      expect(validateRoomCode('AB!2CD').valid).toBe(false);
    });
  });

  describe('generateMockRoomCode', () => {
    it('generates a valid 6-character uppercase alphanumeric code', () => {
      const code = generateMockRoomCode();
      expect(code).toHaveLength(6);
      expect(validateRoomCode(code).valid).toBe(true);
    });
  });
});
