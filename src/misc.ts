export class Stack<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  toArray() {
    return [...this.items];
  }

  push(item: T) {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * callback on dom inserted
 *
 * WARN 这个事件其实已经废弃了，但是...还是可以用，每个浏览器基本都实现了
 * ref: https://caniuse.com/mutation-events
 */
export const onDomInserted = (
  dom: Node,
  fn: (parent: HTMLElement, source: Node) => any
) => {
  const eventName = 'DOMNodeInserted';
  const handler = (event: any) => {
    const parent = event.relatedNode;
    if (parent && parent === dom.parentNode) {
      fn(parent, dom);
    }
  };
  dom.addEventListener(eventName, handler);
  // dispose function
  return () => dom.removeEventListener(eventName, handler);
};

export const createAnchor = (fn?: (parent: HTMLElement) => any, text = '') => {
  const dom = document.createTextNode(text);
  // FIXME: with dispose function bind
  fn && onDomInserted(dom, fn);
  return dom;
};

/**
 * hack something...
 */
export const idleRunner = (canRun: () => boolean, runner: () => any) => {
  const innerRunner = () => {
    if (canRun()) {
      runner();
    } else {
      requestIdleCallback(innerRunner);
    }
  };
  innerRunner();
};
