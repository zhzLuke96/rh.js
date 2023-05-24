import { onDomMutation } from '../common/onDomMutation';
import { AnyRecord, FC } from '../core/types';
import { onUnmount, setupEffect } from '../core/hooks';
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
type StyleComponentProps = {
  style?: NestedCSSProperties;
  styleFn?: StyleFn;
  scoped?: boolean;
  adopted?: boolean;
  [k: string]: any;
};
type StyleComponent = FC<
  StyleComponentProps,
  [StyleFn | NestedCSSProperties | void]
>;

type ConnectStyleSheetOptions = {
  props: StyleComponentProps;
  styleOrFunc?: StyleFn | NestedCSSProperties | void;
  rootNodeSelector: string;
  className?: string;
  scopedId?: string;
};

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

const isDocumentOrShadowRoot = (
  node: Node
): node is DocumentOrShadowRoot & Node =>
  node.nodeType === Node.DOCUMENT_NODE ||
  node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;

const useStyleSheet = (
  { props, scopedId, rootNodeSelector, styleOrFunc }: ConnectStyleSheetOptions,
  anchor: Node
) => {
  const styleFn = zipStyleFn(props.styleFn || props.style || styleOrFunc);
  const context = useContainerContextProxy();
  const { applySheet, removeSheet, parseStyle } = createStyleSheet(
    () => styleFn(context),
    scopedId ? `[data-s-${scopedId}]` : undefined,
    props.adopted
  );

  const { [symbols.STYLESHEET_ROOT]: rootNode } = context;
  setupEffect(() => {
    let realRootNodeSelector = rootNodeSelector;
    if (
      props.adopted &&
      rootNode &&
      rootNode instanceof Node &&
      isDocumentOrShadowRoot(rootNode)
    ) {
      realRootNodeSelector = ':root';
    }
    parseStyle(realRootNodeSelector);
  });

  if (props.adopted) {
    applySheet(rootNode);
    onUnmount(() => removeSheet(rootNode));
  } else {
    if (rootNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // in shadow root
      applySheet(rootNode);
      onUnmount(() => removeSheet(rootNode));
    } else {
      onUnmount(onDomMutation(anchor, applySheet, 'DOMNodeInserted'));
      onUnmount(onDomMutation(anchor, removeSheet, 'DOMNodeRemoved'));
    }
  }
};

const connectStyleSheet = (options: ConnectStyleSheetOptions) => {
  const { scopedId, className } = options;

  const scoped = !!scopedId;
  const anchor = document.createTextNode('');

  useStyleSheet(options, anchor);

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
  onUnmount(onDomMutation(anchor, install, 'DOMNodeInserted', { sync: true }));
  onUnmount(onDomMutation(anchor, uninstall, 'DOMNodeRemoved'));

  return { anchor };
};

/**
 * Adaptive nested css style definition components
 */
export const Style: StyleComponent = (props, state, [styleOrFunc]) => {
  const scopedId = props.scoped ? randomKey() : undefined;
  const className = `s-${randomKey()}`;
  const { anchor } = connectStyleSheet({
    props,
    styleOrFunc,
    rootNodeSelector: `.${className}`,
    className,
    scopedId,
  });

  return () => anchor;
};

/**
 * style for global (inject to html top element)
 */
export const GlobalStyle: StyleComponent = (props, state, [styleOrFunc]) => {
  const { anchor } = connectStyleSheet({
    props: { ...props, scoped: false },
    styleOrFunc,
    rootNodeSelector: ':root',
  });
  return () => anchor;
};
