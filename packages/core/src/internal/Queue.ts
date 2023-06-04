class QueueNode<T> {
  data: T;
  next: QueueNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

export class Queue<T> {
  head: QueueNode<T> | null;
  tail: QueueNode<T> | null;
  size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  enqueue(data: T) {
    let node = new QueueNode(data);
    if (this.isEmpty()) {
      this.head = node;
      this.tail = node;
    } else {
      if (this.tail) {
        this.tail.next = node;
      }
      this.tail = node;
    }
    this.size++;
  }

  dequeue(): T | null {
    if (this.isEmpty()) {
      return null;
    } else {
      let data = this.head?.data || null;
      this.head = this.head?.next || null;
      if (this.isEmpty()) {
        this.tail = null;
      }
      this.size--;
      return data;
    }
  }

  remove(data: T): void {
    let current = this.head;
    let prev = null;

    while (current) {
      if (current.data === data) {
        if (!prev) {
          this.head = current.next;
          if (!this.head) {
            this.tail = null;
          }
        } else {
          prev.next = current.next;
          if (!current.next) {
            this.tail = prev;
          }
        }
        this.size--;
        return;
      }
      prev = current;
      current = current.next;
    }
  }

  isEmpty(): boolean {
    return this.size === 0;
  }
}
