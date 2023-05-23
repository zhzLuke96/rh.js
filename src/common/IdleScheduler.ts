import { Queue } from './Queue';

type IdleTaskFunction = (deadline: { timeRemaining: () => number }) => any;
export class IdleScheduler {
  private frameDeadline: number;
  private taskQueue: Queue<IdleTaskFunction>;
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

  private execTask(task: IdleTaskFunction) {
    task({
      timeRemaining: (): number => this.timeRemaining(),
    });
  }

  private handleTask(): void {
    let task = this.taskQueue.dequeue();
    while (task) {
      this.execTask(task);
      if (this.timeRemaining() <= 0) {
        this.trigger();
        break;
      }
      task = this.taskQueue.dequeue();
    }
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

  public runTask(task: IdleTaskFunction): void {
    if (!this.rafTriggered && performance.now() < this.frameDeadline) {
      this.execTask(task);
      return;
    }
    this.taskQueue.enqueue(task);
    this.trigger();
  }
}

export const globalIdleScheduler = new IdleScheduler();
