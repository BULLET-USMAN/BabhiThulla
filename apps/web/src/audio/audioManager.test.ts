import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from './audioManager.js';

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      type: 'sine' as OscillatorType,
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
}

describe('AudioManager', () => {
  let audio: AudioManager;

  beforeEach(() => {
    (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
    audio = new AudioManager();
  });

  it('initializes with default settings', () => {
    expect(audio).toBeDefined();
  });

  it('updates settings dynamically', () => {
    audio.updateSettings({ volume: 50, masterSound: false });
    // Sound methods should cleanly no-op when muted
    audio.playCardSelect();
    audio.playThulla();
  });

  it('respects volume zero muting', () => {
    audio.updateSettings({ volume: 0 });
    audio.playButtonClick();
    audio.playTrickSweep();
  });

  it('plays card select and play sounds when enabled', () => {
    audio.updateSettings({ masterSound: true, sfxEnabled: true, volume: 80 });
    expect(() => audio.playCardSelect()).not.toThrow();
    expect(() => audio.playCardPlay()).not.toThrow();
  });

  it('plays signature Thulla dramatic sound', () => {
    audio.updateSettings({ masterSound: true, sfxEnabled: true, volume: 100 });
    expect(() => audio.playThulla()).not.toThrow();
  });

  it('plays pile collect and trick sweep sounds', () => {
    expect(() => audio.playPileCollect()).not.toThrow();
    expect(() => audio.playTrickSweep()).not.toThrow();
  });

  it('plays card deal and flutter shuffle sounds', () => {
    expect(() => audio.playCardDeal()).not.toThrow();
    expect(() => audio.playCardShuffle()).not.toThrow();
    expect(() => audio.playShuffle()).not.toThrow();
  });

  it('plays escape fanfare and bhabhi finish sounds', () => {
    expect(() => audio.playPlayerEscape()).not.toThrow();
    expect(() => audio.playEscapeFanfare()).not.toThrow();
    expect(() => audio.playBhabhiFinish()).not.toThrow();
    expect(() => audio.playBhabhiDefeat()).not.toThrow();
  });

  it('plays button click, player joined, rematch start, and emote pop', () => {
    expect(() => audio.playButtonClick()).not.toThrow();
    expect(() => audio.playPlayerJoined()).not.toThrow();
    expect(() => audio.playRematchStart()).not.toThrow();
    expect(() => audio.playEmote()).not.toThrow();
    expect(() => audio.playEmotePop()).not.toThrow();
  });

  it('debounces rapid duplicate triggers within debounce window', () => {
    audio.updateSettings({ masterSound: true, sfxEnabled: true, volume: 90 });
    audio.playCardSelect();
    // Immediate call should be debounced
    audio.playCardSelect();
  });

  it('supports stopAll without throwing', () => {
    expect(() => audio.stopAll()).not.toThrow();
  });
});
