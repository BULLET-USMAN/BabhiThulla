export class ActionQueue {
  private queues = new Map<string, Promise<unknown>>();

  /**
   * Serializes async operations for a given room key to prevent race conditions.
   */
  async runExclusive<T>(key: string, task: () => Promise<T> | T): Promise<T> {
    const current = this.queues.get(key) || Promise.resolve();

    let resolveTask!: (val: T) => void;
    let rejectTask!: (err: unknown) => void;

    const taskPromise = new Promise<T>((resolve, reject) => {
      resolveTask = resolve;
      rejectTask = reject;
    });

    const next = current
      .catch(() => {})
      .then(async () => {
        try {
          const result = await task();
          resolveTask(result);
        } catch (err) {
          rejectTask(err);
        }
      });

    this.queues.set(key, next);

    next.finally(() => {
      if (this.queues.get(key) === next) {
        this.queues.delete(key);
      }
    });

    return taskPromise;
  }
}

export const actionQueue = new ActionQueue();
