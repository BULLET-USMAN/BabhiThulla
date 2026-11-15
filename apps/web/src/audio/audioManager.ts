import { SoundEffectType } from './soundManifest.js';

export interface AudioSettings {
  masterSound: boolean;
  sfxEnabled: boolean;
  volume: number; // 0 to 100
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = {
    masterSound: true,
    sfxEnabled: true,
    volume: 70,
  };

  private lastPlayedTimestamps: Map<SoundEffectType, number> = new Map();
  private readonly debounceMs = 40; // minimum ms between identical sounds
  private unlocked = false;

  constructor() {
    this.setupUnlockListeners();
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.unlocked = true;
        }).catch(() => {});
      } else {
        this.unlocked = true;
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  public updateSettings(settings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  private shouldPlay(type: SoundEffectType): boolean {
    if (!this.settings.masterSound || !this.settings.sfxEnabled || this.settings.volume <= 0) {
      return false;
    }

    const now = performance.now();
    const last = this.lastPlayedTimestamps.get(type) || 0;
    if (now - last < this.debounceMs) {
      return false;
    }

    this.lastPlayedTimestamps.set(type, now);
    return true;
  }

  private getEffectiveGain(baseGain: number): number {
    const volScale = Math.max(0, Math.min(100, this.settings.volume)) / 100;
    return baseGain * volScale;
  }

  public playCardSelect() {
    if (!this.shouldPlay('cardSelect')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.04);

    const gainVal = this.getEffectiveGain(0.08);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playCardPlay() {
    if (!this.shouldPlay('cardPlay')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Tactile felt thump
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    const gainVal = this.getEffectiveGain(0.2);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playCardDeal() {
    if (!this.shouldPlay('cardDeal')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);

    const gainVal = this.getEffectiveGain(0.06);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playCardShuffle() {
    if (!this.shouldPlay('cardShuffle')) return;
    this.initContext();
    if (!this.ctx) return;

    // Series of 6 micro flutters in quick succession
    const startTime = this.ctx.currentTime;
    const flutterCount = 6;
    const flutterSpacing = 0.035;

    for (let i = 0; i < flutterCount; i++) {
      const t = startTime + i * flutterSpacing;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + (i % 2) * 120, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.025);

      const gainVal = this.getEffectiveGain(0.08);
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.025);
    }
  }

  public playTrickSweep() {
    if (!this.shouldPlay('trickSweep')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    const gainVal = this.getEffectiveGain(0.1);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playThulla() {
    if (!this.shouldPlay('thulla')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Dramatic descending brass strike with secondary sub-bass punch
    const leadOsc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    leadOsc.type = 'sawtooth';
    leadOsc.frequency.setValueAtTime(560, now);
    leadOsc.frequency.exponentialRampToValueAtTime(180, now + 0.28);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(60, now + 0.28);

    const gainVal = this.getEffectiveGain(0.18);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    leadOsc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.ctx.destination);

    leadOsc.start(now);
    subOsc.start(now);
    leadOsc.stop(now + 0.28);
    subOsc.stop(now + 0.28);
  }

  public playPileCollect() {
    if (!this.shouldPlay('pileCollect')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Ascending card scoop
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.16);

    const gainVal = this.getEffectiveGain(0.12);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playPlayerEscape() {
    if (!this.shouldPlay('playerEscape')) return;
    this.initContext();
    if (!this.ctx) return;

    // Ascending triumphant arpeggio (C5: 523.25Hz, E5: 659.25Hz, G5: 783.99Hz, C6: 1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = startTime + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gainVal = this.getEffectiveGain(0.14);
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  public playBhabhiFinish() {
    if (!this.shouldPlay('bhabhiFinish')) return;
    this.initContext();
    if (!this.ctx) return;

    // Playful descending minor trombone sting
    const notes = [440, 415.3, 392, 329.63];
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = startTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const gainVal = this.getEffectiveGain(0.12);
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  public playButtonClick() {
    if (!this.shouldPlay('buttonClick')) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    const gainVal = this.getEffectiveGain(0.08);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playPlayerJoined() {
    if (!this.shouldPlay('playerJoined')) return;
    this.initContext();
    if (!this.ctx) return;

    // Friendly 2-tone doorbell chime
    const notes = [587.33, 880];
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = startTime + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gainVal = this.getEffectiveGain(0.1);
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  public playRematchStart() {
    if (!this.shouldPlay('rematchStart')) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [659.25, 987.77];
    const startTime = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = startTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gainVal = this.getEffectiveGain(0.12);
      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  public playEmote() {
    if (!this.shouldPlay('emote')) return;
    this.initContext();
    if (!this.ctx) return;

    // Pop bubble
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    const gainVal = this.getEffectiveGain(0.09);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Convenient Aliases
  public playShuffle() {
    this.playCardShuffle();
  }

  public playEscapeFanfare() {
    this.playPlayerEscape();
  }

  public playBhabhiDefeat() {
    this.playBhabhiFinish();
  }

  public playEmotePop() {
    this.playEmote();
  }

  public stopAll() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }
}

export const audioManager = new AudioManager();
