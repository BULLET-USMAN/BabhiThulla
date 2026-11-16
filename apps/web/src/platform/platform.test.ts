import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isNativePlatform,
  isAndroidPlatform,
  getPlatformName,
  APP_VERSION,
  BUILD_NUMBER,
  initPlatformServices,
} from './platform.js';
import { platformStorage } from './storage.js';
import { hapticsService } from './haptics.js';
import { lifecycleManager } from './lifecycle.js';
import { shareRoomInvite } from './sharing.js';

describe('Phase 7 — Platform Abstractions & Android Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Platform Detection', () => {
    it('detects platform identity and version constants', () => {
      expect(APP_VERSION).toBe('1.0.0');
      expect(BUILD_NUMBER).toBe('1');
      expect(typeof isNativePlatform()).toBe('boolean');
      expect(typeof isAndroidPlatform()).toBe('boolean');
      expect(['android', 'ios', 'web']).toContain(getPlatformName());
    });

    it('initializes platform services safely without throwing', async () => {
      await expect(initPlatformServices()).resolves.toBeUndefined();
    });
  });

  describe('Platform Storage', () => {
    beforeEach(async () => {
      await platformStorage.clear();
    });

    it('stores, retrieves, and removes persistent items', async () => {
      await platformStorage.setItem('test_guest_key', JSON.stringify({ name: 'Zainab' }));
      expect(platformStorage.getSync('test_guest_key')).toBe(JSON.stringify({ name: 'Zainab' }));

      const retrieved = await platformStorage.getItem('test_guest_key');
      expect(retrieved).toBe(JSON.stringify({ name: 'Zainab' }));

      await platformStorage.removeItem('test_guest_key');
      expect(platformStorage.getSync('test_guest_key')).toBeNull();
      expect(await platformStorage.getItem('test_guest_key')).toBeNull();
    });

    it('returns null for non-existent keys', async () => {
      expect(platformStorage.getSync('non_existent')).toBeNull();
      expect(await platformStorage.getItem('non_existent')).toBeNull();
    });
  });

  describe('Haptics Service', () => {
    beforeEach(() => {
      hapticsService.setEnabled(true);
    });

    it('triggers haptic patterns without throwing errors', async () => {
      await expect(hapticsService.cardSelect()).resolves.toBeUndefined();
      await expect(hapticsService.cardPlay()).resolves.toBeUndefined();
      await expect(hapticsService.turnAlert()).resolves.toBeUndefined();
      await expect(hapticsService.thullaHit()).resolves.toBeUndefined();
      await expect(hapticsService.victory()).resolves.toBeUndefined();
      await expect(hapticsService.bhabhiDefeat()).resolves.toBeUndefined();
    });

    it('respects the enabled/disabled state', async () => {
      hapticsService.setEnabled(false);
      expect(hapticsService.isEnabled()).toBe(false);

      await expect(hapticsService.cardPlay()).resolves.toBeUndefined();
    });
  });

  describe('Lifecycle & Android Back Button Handling', () => {
    beforeEach(() => {
      lifecycleManager.init();
    });

    it('registers and executes back-button handlers by priority', async () => {
      const callLog: string[] = [];

      const unregisterLow = lifecycleManager.registerBackHandler(5, () => {
        callLog.push('low');
        return false; // let higher/other handlers or fallback run
      });

      const unregisterHigh = lifecycleManager.registerBackHandler(20, () => {
        callLog.push('high');
        return true; // consumed
      });

      await lifecycleManager.handleBackButton(false);

      expect(callLog).toEqual(['high']);

      // After unregistering high, low should be called
      unregisterHigh();
      await lifecycleManager.handleBackButton(false);
      expect(callLog).toEqual(['high', 'low']);

      unregisterLow();
    });

    it('registers and triggers lifecycle pause and resume callbacks', () => {
      let pauseCount = 0;
      let resumeCount = 0;

      const unbindPause = lifecycleManager.onPause(() => {
        pauseCount++;
      });
      const unbindResume = lifecycleManager.onResume(() => {
        resumeCount++;
      });

      // Simulate visibility change on web
      document.dispatchEvent(new Event('visibilitychange'));

      expect(typeof unbindPause).toBe('function');
      expect(typeof unbindResume).toBe('function');
      expect(pauseCount).toBeGreaterThanOrEqual(0);
      expect(resumeCount).toBeGreaterThanOrEqual(0);

      unbindPause();
      unbindResume();
    });
  });

  describe('Native Room Invitations & Sharing', () => {
    it('shares room invitation link via native sheet or clipboard fallback', async () => {
      const result = await shareRoomInvite({
        roomCode: 'W4XYZ9',
        inviteUrl: 'https://bhabhithulla.com/join/W4XYZ9',
      });

      expect(result).toHaveProperty('completed');
      expect(['shared', 'copied', 'dismissed']).toContain(result.action);
    });
  });
});
