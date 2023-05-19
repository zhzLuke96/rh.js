import { onDomMutation } from '../common/onDomMutation';
import { AnyRecord, FC } from '../core/types';
import { onUnmount, setupEffect } from '../core/reactiveHydrate';
import {
  createStyleSheet,
  NestedCSSProperties,
} from './CSSStyleSheet/StyleSheet';
import { useContainerContextProxy } from '../core/context';
import { symbols } from '../constants';

const randomKey = () =>
  Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);

/**
 * @see [MDN dataset#name_conversion]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion}
 */
function convertToCamelCase(str: string) {
  return str.replace(/-([a-z])/g, function (match, letter) {
    return letter.toUpperCase();
  });
}

type StyleFn = (contextProxy: AnyRecord) => NestedCSSProperties;
type StyleComponent = FC<
  {
    style?: NestedCSSProperties;
    styleFn?: StyleFn;
    scoped?: boolean;
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
  className?: string,
  scopedId?: string
) => {
  const scoped = !!scopedId;
  const context = useContainerContextProxy();
  const { applySheet, removeSheet, parseStyle } = createStyleSheet(
    () => styleFn(context),
    scopedId ? `[data-s-${scopedId}]` : undefined
  );
  const anchor = document.createTextNode('');

  setupEffect(() => parseStyle(rootNodeSelector));
  onUnmount(onDomMutation(anchor, applySheet, 'DOMNodeInserted'));
  onUnmount(onDomMutation(anchor, removeSheet, 'DOMNodeRemoved'));
  onUnmount(removeSheet);

  let observer: MutationObserver | undefined;
  const datasetKey = convertToCamelCase(`s-${scopedId}`);
  const installToDOM = (dom: any) => {
    if ('dataset' in dom && typeof dom['dataset'] === 'object') {
      if (
        dom[symbols.STYLESHEET_SCOPED] !== undefined &&
        dom[symbols.STYLESHEET_SCOPED] !== datasetKey
      ) {
        return;
      }
      dom.dataset[datasetKey] = '';
      dom[symbols.STYLESHEET_SCOPED] = datasetKey;
    }
  };
  const uninstallFromDOM = (dom: any) => {
    if ('dataset' in dom && typeof dom['dataset'] === 'object') {
      if (
        dom[symbols.STYLESHEET_SCOPED] !== undefined &&
        dom[symbols.STYLESHEET_SCOPED] !== datasetKey
      ) {
        return;
      }
      delete dom.dataset[datasetKey];
      delete dom[symbols.STYLESHEET_SCOPED];
    }
  };
  const installScopedObserver = (parent: any) => {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const { addedNodes, removedNodes } = mutation;
        addedNodes.forEach((addedNode) => installToDOM(addedNode));
        removedNodes.forEach((removedNode) => uninstallFromDOM(removedNode));
      }
    });
    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  };

  const install = (parent: any) => {
    if (scoped) {
      installToDOM(parent);
      installScopedObserver(parent);
    }
    if (className && parent instanceof Element) {
      parent.classList.add(className);
    }
  };
  const uninstall = (parent: any) => {
    uninstallFromDOM(parent);
    observer?.disconnect();
    if (className && parent instanceof Element) {
      parent.classList.remove(className);
    }
  };
  onUnmount(onDomMutation(anchor, install, 'DOMNodeInserted'));
  onUnmount(onDomMutation(anchor, uninstall, 'DOMNodeRemoved'));

  return { anchor };
};

/**
 * Adaptive nested css style definition components
 */
export const Style: StyleComponent = (props, styleOrFunc) => {
  const _styleFn = zipStyleFn(props.styleFn || props.style || styleOrFunc);

  const scopedId = props.scoped ? randomKey() : undefined;
  const className = `s-${randomKey()}`;
  const { anchor } = connectStyleSheet(
    _styleFn,
    `.${className}`,
    className,
    scopedId
  );

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
