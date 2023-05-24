import { globalIdleScheduler } from './IdleScheduler';

/**
 * callback on dom inserted
 *
 * WARN 这个事件其实已经废弃了，但是...还是可以用，每个浏览器基本都实现了
 * ref: https://caniuse.com/mutation-events
 */
export const onDomMutation = (
  dom: Node,
  fn: (parent: HTMLElement, source: Node) => any,
  mutationEvent: 'DOMNodeInserted' | 'DOMNodeRemoved',
  options?: {
    maybeFragment?: boolean;
    sync?: boolean;
  }
) => {
  const handler = (event: any) => {
    const parent = event.relatedNode;
    if (!parent) {
      return;
    }
    if (
      !options?.maybeFragment &&
      parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }
    if (parent === dom.parentNode) {
      if (options?.sync) {
        fn(parent, dom);
      } else {
        globalIdleScheduler.runTask(() => fn(parent, dom));
      }
      // fn(parent, dom);
    }
  };
  dom.addEventListener(mutationEvent, handler);
  // dispose function
  return () => dom.removeEventListener(mutationEvent, handler);
};
