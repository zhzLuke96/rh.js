import { Queue } from './Queue';

export type IdleTask<T> = {
  promise: Promise<T | undefined>;
  cancel: () => void;
  state: () => {
    isCancelled: boolean;
    isDone: boolean;
    result: any;
  };
};

type IdleTaskFunction<RET> = (deadline: { timeRemaining: () => number }) => RET;
export class IdleScheduler {
  private frameDeadline: number;
  private taskQueue: Queue<IdleTaskFunction<any>>;
  private channel: MessageChannel;
  private messagePort: MessagePort;
  private triggerPort: MessagePort;
  private rafTriggered: boolean;
  private activeFrameTime = 33.33;

  constructor() {
    this.frameDeadline = performance.now() + this.activeFrameTime;
    this.taskQueue = new Queue<() => any>();
    this.channel = new MessageChannel();
    this.messagePort = this.channel.port1;
    this.triggerPort = this.channel.port2;
    this.rafTriggered = false;

    this.messagePort.onmessage = () => {
      this.handleTask();
    };
  }

  public size() {
    return this.taskQueue.size;
  }

  private timeRemaining() {
    return Math.max(0, this.frameDeadline - performance.now());
  }

  private execTask(task: IdleTaskFunction<any>) {
    return task({
      timeRemaining: (): number => this.timeRemaining(),
    });
  }

  private handleTask(): void {
    if (this.timeRemaining() <= 0) {
      this.trigger();
      return;
    }
    let task = this.taskQueue.dequeue();
    while (task) {
      try {
        this.execTask(task);
      } finally {
        if (this.timeRemaining() <= 0) {
          break;
        }
        task = this.taskQueue.dequeue();
      }
    }
    this.trigger();
  }

  private trigger() {
    if (this.rafTriggered) {
      return;
    }
    if (this.taskQueue.size === 0) {
      return;
    }
    this.rafTriggered = true;
    requestAnimationFrame((rafTime) => {
      this.frameDeadline = rafTime + this.activeFrameTime;
      this.rafTriggered = false;
      if (rafTime < this.frameDeadline) {
        this.triggerPort.postMessage(null);
      }
    });
  }

  public async runTask<RET = any>(task: IdleTaskFunction<RET>): Promise<RET> {
    if (!this.rafTriggered && performance.now() < this.frameDeadline) {
      return this.execTask(task);
    }
    return new Promise<RET>((resolve, reject) => {
      this.taskQueue.enqueue(() => {
        try {
          resolve(this.execTask(task));
        } catch (error) {
          reject(error);
        }
      });
      this.trigger();
    });
  }

  public buildTask<RET = any>(task: IdleTaskFunction<RET>): IdleTask<RET> {
    let isCancelled = false;
    let isDone = false;
    let result = undefined as any;

    let resolve: any, reject: any;
    const promise = new Promise<RET | undefined>((arg1, arg2) => {
      resolve = arg1;
      reject = arg2;
    });
    const wrappedTask = (deadline: { timeRemaining: () => number }) => {
      if (isCancelled) {
        resolve(undefined);
        return;
      }
      result = task(deadline);
      isDone = true;
      resolve(result);
      return result;
    };
    this.taskQueue.enqueue(wrappedTask);

    const cancel = (): void => {
      isCancelled = true;
      resolve(undefined);
      if (this.taskQueue.size <= /* a magic number => */ 5000) {
        this.taskQueue.remove(wrappedTask);
      }
    };

    this.trigger();

    return {
      cancel,
      promise,
      state: () => ({ isCancelled, isDone, result }),
    };
  }
}

/**
 * when the browser is not support MessageChannel, sync mode will be used
 *
 * NOTE: test env is not support MessageChannel, so we use sync mode in test env
 */
export class IdleSchedulerSync {
  public size() {
    return 0;
  }

  public async runTask<RET = any>(task: IdleTaskFunction<RET>): Promise<RET> {
    return Promise.resolve(task({ timeRemaining: () => 0 }));
  }

  public buildTask<RET = any>(task: IdleTaskFunction<RET>): IdleTask<RET> {
    let result = undefined as any;
    return {
      cancel: () => {},
      promise: this.runTask(task).then((r) => {
        result = r;
        return r;
      }),
      state: () => ({ isCancelled: false, isDone: true, result }),
    };
  }
}

/**
 * async mode
 *
 * use setTimeout to simulate async mode, for async test case
 */
export class IdleSchedulerAsync {
  public size() {
    return 0;
  }

  public async runTask<RET = any>(task: IdleTaskFunction<RET>): Promise<RET> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(task({ timeRemaining: () => 0 }));
      }, 0);
    });
  }

  public buildTask<RET = any>(task: IdleTaskFunction<RET>): IdleTask<RET> {
    let result = undefined as any;
    return {
      cancel: () => {},
      promise: this.runTask(task).then((r) => {
        result = r;
        return r;
      }),
      state: () => ({ isCancelled: false, isDone: true, result }),
    };
  }
}

const is_sync_env =
  typeof requestIdleCallback === 'function' && !!window.MessageChannel;
export const globalIdleScheduler = is_sync_env
  ? new IdleScheduler()
  : new IdleSchedulerAsync();

export class UniqIdleScheduler {
  tasks = new Map<string, IdleTask<any>>();

  runTask<RET>(id: string, task: IdleTaskFunction<RET>) {
    const wipTask = this.tasks.get(id);
    if (wipTask) {
      wipTask.cancel();
    }
    const processTask = globalIdleScheduler.buildTask(task);
    this.tasks.set(id, processTask);
    processTask.promise.finally(() => {
      if (this.tasks.get(id) === processTask) {
        this.tasks.delete(id);
      }
    });
    return processTask;
  }

  dispose() {
    this.tasks.forEach((task) => task.cancel());
    this.tasks.clear();
  }
}
