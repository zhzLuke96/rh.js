import { Queue } from './Queue';

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
    if (this.taskQueue.length === 0) {
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
}

export const globalIdleScheduler = new IdleScheduler();
