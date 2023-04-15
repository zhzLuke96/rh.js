import { NestedCSSProperties, rStyle } from '../tools/rStyle';
import { rh } from '../rh';
import { onUnmount } from '../ComponentSource';

/**
 * Adaptive nested css style definition components
 */
export const Style = ({
  styleFn,
  ...props
}: {
  styleFn: () => NestedCSSProperties;
  [k: string]: any;
}) => {
  const { className, dom } = rStyle(styleFn);
  // WARN 这个事件其实已经废弃了，但是...还是可以用，每个浏览器基本都实现了
  // ref: https://caniuse.com/mutation-events
  const eventName = 'DOMNodeInserted';
  const handler = (event: any) => {
    const parent = event.relatedNode;
    if (parent && parent === dom.parentNode) {
      parent.classList.add(className);
    }
  };
  dom.addEventListener(eventName, handler);
  onUnmount(() => dom.removeEventListener(eventName, handler));
  rh(dom, props);
  return () => dom;
};
