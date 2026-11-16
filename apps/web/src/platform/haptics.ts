import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from './platform.js';

class HapticsService {
  private enabled = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Subtle vibration when a card is selected in the hand
   */
  public async cardSelect(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Medium vibration when playing a card to the table
   */
  public async cardPlay(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Distinct vibration when your turn arrives
   */
  public async turnAlert(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Dramatic vibration when a Thulla is hit!
   */
  public async thullaHit(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 50, 100]);
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Celebration vibration when escaping or concluding the match
   */
  public async victory(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 60, 40, 100]);
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Subtle alert when someone becomes the Bhabhi
   */
  public async bhabhiDefeat(): Promise<void> {
    if (!this.enabled) return;
    try {
      if (isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([150, 80, 150]);
      }
    } catch {
      // Graceful fallback
    }
  }
}

export const hapticsService = new HapticsService();
