import { NestedCSSProperties, rStyle } from '../tools/rStyle';
import { FC, rh } from '../rh';
import { onUnmount } from '../ComponentSource';

export const onDomInserted = (
  dom: HTMLElement,
  fn: (parent: HTMLElement) => any
) => {
  // WARN 这个事件其实已经废弃了，但是...还是可以用，每个浏览器基本都实现了
  // ref: https://caniuse.com/mutation-events
  const eventName = 'DOMNodeInserted';
  const handler = (event: any) => {
    const parent = event.relatedNode;
    if (parent && parent === dom.parentNode) {
      fn(parent);
    }
  };
  dom.addEventListener(eventName, handler);
  // dispose function
  return () => dom.removeEventListener(eventName, handler);
};

type StyleFn = () => NestedCSSProperties;
type StyleComponent = FC<
  {
    style?: NestedCSSProperties;
    styleFn?: StyleFn;
    [k: string]: any;
  },
  [StyleFn | NestedCSSProperties | void]
>;

const zipStyleFn = (
  styleOrFn?: StyleFn | NestedCSSProperties | null | void
): StyleFn => {
  if (!styleOrFn) {
    return () => ({ '--required-style-function': '1' });
  }
  if (typeof styleOrFn === 'function') {
    return styleOrFn;
  }
  return () => styleOrFn;
};

/**
 * Adaptive nested css style definition components
 */
export const Style: StyleComponent = (
  { styleFn, style, ...props },
  styleOrFunc
) => {
  const _styleFn = zipStyleFn(styleFn || style || styleOrFunc);
  const { className, dom } = rStyle(_styleFn);
  let parentNode: any;
  const disposeEvent = onDomInserted(dom, (parent) => {
    parent.classList.add(className);
    parentNode?.classList.remove(className);
    parentNode = parent;
  });
  onUnmount(() => {
    disposeEvent();
    parentNode?.classList.remove(className);
  });
  rh(dom, props);
  return () => dom;
};

/**
 * style for global (inject to html top element)
 */
export const GlobalStyle: StyleComponent = (
  { styleFn, style, ...props },
  styleOrFunc
) => {
  const _styleFn = zipStyleFn(styleFn || style || styleOrFunc);
  const { className, dom } = rStyle(_styleFn);
  document.head.parentElement?.classList.add(className);
  document.head.appendChild(dom);
  onUnmount(() => {
    document.head.parentElement?.classList.remove(className);
    document.head.removeChild(dom);
  });
  rh(dom, props);
  return () => dom;
};
