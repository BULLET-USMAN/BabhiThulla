import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimationQueue } from './animationQueue.js';

describe('AnimationQueue', () => {
  let queue: AnimationQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new AnimationQueue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes in an idle state', () => {
    expect(queue.getQueueLength()).toBe(0);
    expect(queue.isBusy()).toBe(false);
  });

  it('processes animations sequentially with proper callbacks', () => {
    const onStart1 = vi.fn();
    const onComplete1 = vi.fn();
    const onStart2 = vi.fn();
    const onComplete2 = vi.fn();

    queue.enqueue({
      id: 'anim-1',
      type: 'PLAY_CARD',
      revision: 1,
      durationMs: 300,
      onStart: onStart1,
      onComplete: onComplete1,
    });

    queue.enqueue({
      id: 'anim-2',
      type: 'TRICK_SWEEP',
      revision: 2,
      durationMs: 400,
      onStart: onStart2,
      onComplete: onComplete2,
    });

    expect(onStart1).toHaveBeenCalledTimes(1);
    expect(onComplete1).not.toHaveBeenCalled();
    expect(onStart2).not.toHaveBeenCalled();
    expect(queue.isBusy()).toBe(true);

    // Advance 300ms
    vi.advanceTimersByTime(300);
    expect(onComplete1).toHaveBeenCalledTimes(1);
    expect(onStart2).toHaveBeenCalledTimes(1);
    expect(onComplete2).not.toHaveBeenCalled();

    // Advance 400ms
    vi.advanceTimersByTime(400);
    expect(onComplete2).toHaveBeenCalledTimes(1);
    expect(queue.isBusy()).toBe(false);
  });

  it('executes animations instantly when reducedMotion is enabled', () => {
    queue.setReducedMotion(true);

    const onStart = vi.fn();
    const onComplete = vi.fn();

    queue.enqueue({
      id: 'anim-reduced',
      type: 'THULLA',
      revision: 1,
      durationMs: 1000,
      onStart,
      onComplete,
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(queue.getQueueLength()).toBe(0);
    expect(queue.isBusy()).toBe(false);
  });

  it('discards stale animations with revision numbers lower than current', () => {
    const onStartStale = vi.fn();

    // Set revision to 5
    queue.enqueue({
      id: 'anim-modern',
      type: 'DEAL',
      revision: 5,
      durationMs: 200,
    });

    // Enqueue obsolete animation revision 3
    queue.enqueue({
      id: 'anim-stale',
      type: 'PLAY_CARD',
      revision: 3,
      durationMs: 200,
      onStart: onStartStale,
    });

    expect(onStartStale).not.toHaveBeenCalled();
    expect(queue.getQueueLength()).toBe(0);
  });

  it('clears active and pending animations on clear()', () => {
    const onComplete1 = vi.fn();
    const onStart2 = vi.fn();

    queue.enqueue({
      id: 'anim-1',
      type: 'PLAY_CARD',
      revision: 1,
      durationMs: 500,
      onComplete: onComplete1,
    });

    queue.enqueue({
      id: 'anim-2',
      type: 'THULLA',
      revision: 2,
      durationMs: 500,
      onStart: onStart2,
    });

    expect(queue.getQueueLength()).toBe(1);

    queue.clear(10);

    expect(onComplete1).toHaveBeenCalledTimes(1); // Cleans up active
    expect(onStart2).not.toHaveBeenCalled(); // Dropped pending
    expect(queue.getQueueLength()).toBe(0);
    expect(queue.isBusy()).toBe(false);
  });

  it('skips all animations immediately when skipAll() is called', () => {
    const onStart1 = vi.fn();
    const onComplete1 = vi.fn();
    const onStart2 = vi.fn();
    const onComplete2 = vi.fn();

    queue.enqueue({
      id: 'anim-1',
      type: 'DEAL',
      revision: 1,
      durationMs: 1500,
      onStart: onStart1,
      onComplete: onComplete1,
    });

    queue.enqueue({
      id: 'anim-2',
      type: 'PLAY_CARD',
      revision: 2,
      durationMs: 400,
      onStart: onStart2,
      onComplete: onComplete2,
    });

    queue.skipAll();

    expect(onComplete1).toHaveBeenCalledTimes(1);
    expect(onStart2).toHaveBeenCalledTimes(1);
    expect(onComplete2).toHaveBeenCalledTimes(1);
    expect(queue.getQueueLength()).toBe(0);
    expect(queue.isBusy()).toBe(false);
  });
});
