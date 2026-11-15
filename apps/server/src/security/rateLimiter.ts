interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private limits = new Map<string, RateLimitRecord>();

  /**
   * @param maxRequests Maximum requests allowed within the window.
   * @param windowMs Time window in milliseconds.
   */
  constructor(
    private maxRequests: number = 30,
    private windowMs: number = 10000
  ) {}

  /**
   * Checks whether an action by the given key (e.g. socket.id or IP) exceeds rate limits.
   * Returns true if allowed, false if rate limited.
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    let record = this.limits.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.limits.set(key, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      return false;
    }

    record.timestamps.push(now);
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.limits.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);
      if (record.timestamps.length === 0) {
        this.limits.delete(key);
      }
    }
  }
}
