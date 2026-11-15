export type AnimationType =
  | 'DEAL'
  | 'PLAY_CARD'
  | 'THULLA'
  | 'TRICK_SWEEP'
  | 'PLAYER_ESCAPE'
  | 'BHABHI_DECLARED';

export interface QueuedAnimation {
  id: string;
  type: AnimationType;
  revision: number;
  durationMs: number;
  onStart?: () => void;
  onComplete?: () => void;
}

export class AnimationQueue {
  private queue: QueuedAnimation[] = [];
  private currentAnimation: QueuedAnimation | null = null;
  private currentTimer: NodeJS.Timeout | null = null;
  private latestRevision: number = 0;
  private reducedMotion: boolean = false;
  private isProcessing: boolean = false;

  public setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public isBusy(): boolean {
    return this.isProcessing || this.currentAnimation !== null;
  }

  /**
   * Enqueues an animation tied to a specific authoritative game revision.
   * If the revision is older than the latest seen revision, it is dropped as stale.
   */
  public enqueue(anim: QueuedAnimation): void {
    if (anim.revision < this.latestRevision) {
      // Obsolete animation from an older snapshot
      return;
    }

    this.latestRevision = Math.max(this.latestRevision, anim.revision);

    if (this.reducedMotion) {
      // Execute immediately without delay
      anim.onStart?.();
      anim.onComplete?.();
      return;
    }

    this.queue.push(anim);
    this.processNext();
  }

  /**
   * Drops all queued animations and cancels the active animation.
   * Called during reconnect, fast snapshot recovery, or when leaving a room.
   */
  public clear(targetRevision?: number): void {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    if (this.currentAnimation) {
      this.currentAnimation.onComplete?.();
      this.currentAnimation = null;
    }

    this.queue = [];
    this.isProcessing = false;
    if (targetRevision !== undefined) {
      this.latestRevision = targetRevision;
    }
  }

  /**
   * Skips all remaining animations in the queue instantly.
   */
  public skipAll(): void {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    if (this.currentAnimation) {
      this.currentAnimation.onComplete?.();
      this.currentAnimation = null;
    }

    const remaining = [...this.queue];
    this.queue = [];
    this.isProcessing = false;

    for (const anim of remaining) {
      anim.onStart?.();
      anim.onComplete?.();
    }
  }

  private processNext(): void {
    if (this.isProcessing || this.currentAnimation !== null) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    this.isProcessing = true;
    this.currentAnimation = next;

    try {
      next.onStart?.();
    } catch (e) {
      console.warn('Error in animation onStart', e);
    }

    const duration = this.reducedMotion ? 0 : next.durationMs;

    this.currentTimer = setTimeout(() => {
      this.currentTimer = null;
      try {
        next.onComplete?.();
      } catch (e) {
        console.warn('Error in animation onComplete', e);
      }
      this.currentAnimation = null;
      this.isProcessing = false;
      this.processNext();
    }, duration);
  }
}

export const animationQueue = new AnimationQueue();
