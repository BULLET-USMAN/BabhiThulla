import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform.js';

class PlatformStorage {
  private memoryCache: Map<string, string> = new Map();
  private initialized = false;

  constructor() {
    this.hydrateFromLocalStorage();
  }

  private hydrateFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            this.memoryCache.set(key, val);
          }
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    if (isNativePlatform()) {
      try {
        const { keys } = await Preferences.keys();
        for (const key of keys) {
          const { value } = await Preferences.get({ key });
          if (value !== null) {
            this.memoryCache.set(key, value);
          }
        }
      } catch (err) {
        console.warn('Native preferences initialization fallback:', err);
      }
    }
    this.initialized = true;
  }

  public getSync(key: string): string | null {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) ?? null;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          this.memoryCache.set(key, val);
          return val;
        }
      } catch {
        // Fallback
      }
    }
    return null;
  }

  public async getItem(key: string): Promise<string | null> {
    if (isNativePlatform()) {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null) {
          this.memoryCache.set(key, value);
          return value;
        }
      } catch {
        // Fallback to cache/local
      }
    }
    return this.getSync(key);
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.memoryCache.set(key, value);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignore
      }
    }

    if (isNativePlatform()) {
      try {
        await Preferences.set({ key, value });
      } catch (err) {
        console.warn('Failed saving to native Preferences:', err);
      }
    }
  }

  public async removeItem(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    }

    if (isNativePlatform()) {
      try {
        await Preferences.remove({ key });
      } catch (err) {
        console.warn('Failed removing from native Preferences:', err);
      }
    }
  }

  public async clear(): Promise<void> {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {
        // Ignore
      }
    }
    if (isNativePlatform()) {
      try {
        await Preferences.clear();
      } catch {
        // Ignore
      }
    }
  }
}

export const platformStorage = new PlatformStorage();
