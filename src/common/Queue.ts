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
  length: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
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
    this.length++;
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
      this.length--;
      return data;
    }
  }

  isEmpty(): boolean {
    return this.length === 0;
  }
}
