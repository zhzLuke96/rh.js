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

export const globalIdleScheduler = new IdleScheduler();
