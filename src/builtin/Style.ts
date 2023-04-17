import { NestedCSSProperties, rStyle } from '../tools/rStyle';
import { FC, rh } from '../rh';
import { onUnmount } from '../ComponentSource';

type StyleFn = () => NestedCSSProperties;
type StyleComponent = FC<
  {
    style?: NestedCSSProperties;
    styleFn?: StyleFn;
    [k: string]: any;
  },
  [StyleFn | NestedCSSProperties | void]
>;

/**
 * Adaptive nested css style definition components
 */
export const Style: StyleComponent = (
  { styleFn, style, ...props },
  styleOrFunc
) => {
  const _styleFn =
    styleFn || style
      ? () => style!
      : false || styleOrFunc
      ? typeof styleOrFunc === 'function'
        ? styleOrFunc
        : () => styleOrFunc
      : false || (() => ({ '--required-style-function': '1' }));
  const { className, dom } = rStyle(_styleFn);
  // WARN 这个事件其实已经废弃了，但是...还是可以用，每个浏览器基本都实现了
  // ref: https://caniuse.com/mutation-events
  const eventName = 'DOMNodeInserted';
  let parentNode: any;
  const handler = (event: any) => {
    const parent = event.relatedNode;
    if (parent && parent === dom.parentNode) {
      parent.classList.add(className);
      parentNode?.classList.remove(className);
      parentNode = parent;
    }
  };
  dom.addEventListener(eventName, handler);
  onUnmount(() => {
    dom.removeEventListener(eventName, handler);
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
  const _styleFn =
    styleFn || style
      ? () => style!
      : false || styleOrFunc
      ? typeof styleOrFunc === 'function'
        ? styleOrFunc
        : () => styleOrFunc
      : false || (() => ({ '--required-style-function': '1' }));
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
