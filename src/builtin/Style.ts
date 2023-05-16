import { onDomMutation } from '../common/onDomMutation';
import { FC } from '../core/types';
import { onUnmount, setupEffect } from '../core/reactiveHydrate';
import {
  createStyleSheet,
  NestedCSSProperties,
} from './CSSStyleSheet/StyleSheet';

const uniqClassName = () =>
  `__s_${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;

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
    throw new Error('styleOrFn is required.');
  }
  if (typeof styleOrFn === 'function') {
    return styleOrFn;
  }
  return () => styleOrFn;
};

const connectStyleSheet = (
  styleFn: StyleFn,
  rootNodeSelector: string,
  className?: string
) => {
  const { applySheet, removeSheet, parseStyle } = createStyleSheet(styleFn);
  const anchor = document.createTextNode('');

  setupEffect(() => parseStyle(rootNodeSelector));
  onUnmount(onDomMutation(anchor, applySheet, 'DOMNodeInserted'));
  onUnmount(onDomMutation(anchor, removeSheet, 'DOMNodeRemoved'));
  onUnmount(removeSheet);

  if (className) {
    const removeClassName = (parent: Element) =>
      parent?.classList?.remove(className);
    const addClassName = (parent: Element) => parent?.classList?.add(className);
    onUnmount(onDomMutation(anchor, addClassName, 'DOMNodeInserted'));
    onUnmount(onDomMutation(anchor, removeClassName, 'DOMNodeRemoved'));
  }

  return { anchor };
};

/**
 * Adaptive nested css style definition components
 */
export const Style: StyleComponent = (props, styleOrFunc) => {
  const _styleFn = zipStyleFn(props.styleFn || props.style || styleOrFunc);

  const className = uniqClassName();
  const { anchor } = connectStyleSheet(_styleFn, `.${className}`, className);

  return () => anchor;
};

/**
 * style for global (inject to html top element)
 */
export const GlobalStyle: StyleComponent = (props, styleOrFunc) => {
  const _styleFn = zipStyleFn(props.styleFn || props.style || styleOrFunc);
  const { anchor } = connectStyleSheet(_styleFn, ':root');
  return () => anchor;
};
