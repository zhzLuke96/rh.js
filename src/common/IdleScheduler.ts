export class IdleScheduler {
  tasks = [] as (() => any)[];
  isRunning = false;
  threshold = 10;

  runTask(callback: () => any) {
    this.tasks.push(callback);
    this.triggerSchedule();
  }

  triggerSchedule() {
    if (this.tasks.length === 0) return;
    if (this.isRunning) return;

    this.isRunning = true;
    requestIdleCallback((deadline) => {
      try {
        while (this.tasks.length > 0) {
          const callback = this.tasks.shift();
          if (!callback) {
            break;
          }
          callback();
          if (deadline.timeRemaining() <= this.threshold) {
            break;
          }
        }
      } finally {
        this.isRunning = false;
      }
      requestAnimationFrame(() => this.triggerSchedule());
    });
  }
}

export const globalIdleScheduler = new IdleScheduler();
