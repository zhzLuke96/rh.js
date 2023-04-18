import { NestedCSSProperties, rGlobalStyle, rStyle } from '../tools/rStyle';
import { FC, rh } from '../rh';
import { onUnmount } from '../ComponentSource';
import { onDomInserted } from '../misc';

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
  const { dom } = rGlobalStyle(_styleFn);
  rh(dom, props);
  return () => dom;
};
