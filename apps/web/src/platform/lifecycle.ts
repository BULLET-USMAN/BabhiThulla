import { App } from '@capacitor/app';
import { isNativePlatform } from './platform.js';

type BackButtonHandler = () => boolean | Promise<boolean>;

interface RegisteredBackHandler {
  priority: number;
  handler: BackButtonHandler;
}

class LifecycleManager {
  private backHandlers: RegisteredBackHandler[] = [];
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];
  private isListening = false;
  private lastBackEventTime = 0;

  public init(): void {
    if (this.isListening) return;
    this.isListening = true;

    if (isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          this.triggerResume();
        } else {
          this.triggerPause();
        }
      }).catch(() => {});

      App.addListener('backButton', async ({ canGoBack }) => {
        const now = Date.now();
        // Debounce back button events (prevent double trigger within 350ms)
        if (now - this.lastBackEventTime < 350) return;
        this.lastBackEventTime = now;

        await this.handleBackButton(canGoBack);
      }).catch(() => {});
    }

    // Web visibility fallback
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.triggerPause();
        } else {
          this.triggerResume();
        }
      });
    }
  }

  public registerBackHandler(priority: number, handler: BackButtonHandler): () => void {
    const item: RegisteredBackHandler = { priority, handler };
    this.backHandlers.push(item);
    this.backHandlers.sort((a, b) => b.priority - a.priority);

    return () => {
      this.backHandlers = this.backHandlers.filter((h) => h !== item);
    };
  }

  public async handleBackButton(canGoBack = false): Promise<void> {
    // Execute top-priority handlers first
    for (const entry of this.backHandlers) {
      try {
        const handled = await entry.handler();
        if (handled) return;
      } catch (err) {
        console.warn('Error in back button handler:', err);
      }
    }

    // Default fallback
    if (canGoBack && typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else if (isNativePlatform()) {
      try {
        await App.exitApp();
      } catch {
        // Ignore
      }
    }
  }

  public onPause(callback: () => void): () => void {
    this.pauseCallbacks.push(callback);
    return () => {
      this.pauseCallbacks = this.pauseCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onResume(callback: () => void): () => void {
    this.resumeCallbacks.push(callback);
    return () => {
      this.resumeCallbacks = this.resumeCallbacks.filter((cb) => cb !== callback);
    };
  }

  private triggerPause() {
    for (const cb of this.pauseCallbacks) {
      try {
        cb();
      } catch (err) {
        console.warn('Error in lifecycle pause callback:', err);
      }
    }
  }

  private triggerResume() {
    for (const cb of this.resumeCallbacks) {
      try {
        cb();
      } catch (err) {
        console.warn('Error in lifecycle resume callback:', err);
      }
    }
  }
}

export const lifecycleManager = new LifecycleManager();
