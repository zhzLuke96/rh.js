import {
  createStyleSheet,
  NestedCSSProperties,
} from "./CSSStyleSheet/StyleSheet";
import { symbols } from "./constants";
import { useContextProxy } from "@rhjs/core";
import {
  createEffect,
  onUnmounted,
  FC,
  onBeforeMount,
  useCurrentView,
  View,
  onMounted,
  DOMView,
  onAfterUpdate,
  markHasOutsideEffect,
} from "@rhjs/core";

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

type StyleFn = (contextProxy: any) => NestedCSSProperties;
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
    throw new Error("styleOrFn is required.");
  }
  if (typeof styleOrFn === "function") {
    return styleOrFn;
  }
  return () => styleOrFn;
};

const isDocumentOrShadowRoot = (
  node: Node
): node is DocumentOrShadowRoot & Node =>
  node.nodeType === Node.DOCUMENT_NODE ||
  node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;

const useStyleSheet = ({
  props,
  scopedId,
  rootNodeSelector,
  styleOrFunc,
}: ConnectStyleSheetOptions) => {
  const styleFn = zipStyleFn(props.styleFn || props.style || styleOrFunc);
  const context = useContextProxy();
  const { applySheet, removeSheet, parseStyle } = createStyleSheet(
    () => styleFn(context),
    scopedId ? `[data-s-${scopedId}]` : undefined,
    props.adopted
  );

  const { [symbols.STYLESHEET_ROOT]: rootNode } = context;
  createEffect(() => {
    let realRootNodeSelector = rootNodeSelector;
    if (
      props.adopted &&
      rootNode &&
      rootNode instanceof Node &&
      isDocumentOrShadowRoot(rootNode)
    ) {
      realRootNodeSelector = ":root";
    }
    parseStyle(realRootNodeSelector);
  });

  if (props.adopted) {
    applySheet(rootNode);
    onUnmounted(() => removeSheet(rootNode));
  } else {
    if (rootNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // in shadow root
      applySheet(rootNode);
      onUnmounted(() => removeSheet(rootNode));
    } else {
      let parentElement: any;
      onBeforeMount((parent) => {
        applySheet(parent);
        parentElement = parent;
      });
      onUnmounted(() => removeSheet(parentElement));
    }
  }
};

// 链接到绑定的父级view之下的所有非container子元素
const connectSubElements = (options: ConnectStyleSheetOptions) => {
  const { scopedId } = options;
  if (!scopedId) {
    return;
  }
  const scopedKey = convertToCamelCase(`s-${scopedId}`);

  let parentView: View | null = null;
  let parentNode: Node | null = null;
  let elements = new Set<Node>();

  const installToDOM = (node: any) => {
    if (node && "dataset" in node && typeof node["dataset"] === "object") {
      node.dataset[scopedKey] = "";
    }
  };
  const uninstallToDOM = (node: any) => {
    if (node && "dataset" in node && typeof node["dataset"] === "object") {
      delete node.dataset[scopedKey];
    }
  };

  const updateElements = () => {
    const nextElements = new Set<Node>();
    const collectElements = (view?: View | null) => {
      if (!view) {
        return;
      }
      if (view !== parentView && view.is_container) {
        return;
      }
      if (view instanceof DOMView) {
        nextElements.add(view.elem);
      }
      for (const child of view.children) {
        const childView = View.dom2view.get(child);
        if (childView) {
          collectElements(childView);
        } else {
          if (child instanceof Element) {
            nextElements.add(child);
          }
        }
      }
    };
    collectElements(parentView);

    for (const node of nextElements) {
      installToDOM(node);
    }
    for (const node of elements) {
      if (nextElements.has(node)) {
        continue;
      }
      uninstallToDOM(node);
    }
    elements = nextElements;
  };

  onMounted((node, view) => {
    parentNode = node;
    parentView = view;
    updateElements();
    installToDOM(node);
  });
  onAfterUpdate(() => {
    updateElements();
  });
  onUnmounted(() => {
    uninstallToDOM(parentNode);
    for (const node of elements) {
      uninstallToDOM(node);
    }
  });
};

const connectStyleSheet = (options: ConnectStyleSheetOptions) => {
  const { className } = options;

  useStyleSheet(options);
  connectSubElements(options);

  let parentElement: any = null;
  onBeforeMount((parent) => {
    parentElement = parent;
    if (className && parent instanceof Element) {
      parent.classList.add(className);
    }
  });
  onUnmounted(() => {
    if (className && parentElement instanceof Element) {
      parentElement.classList.remove(className);
    }
  });
};

/**
 * Adaptive nested css style definition components
 */
export const Style: StyleComponent = (props, state, [styleOrFunc]) => {
  markHasOutsideEffect();

  const scopedId = props.scoped ? randomKey() : undefined;
  const className = `s-${randomKey()}`;
  connectStyleSheet({
    props,
    styleOrFunc,
    rootNodeSelector: `.${className}`,
    className,
    scopedId,
  });

  return () => null;
};

/**
 * style for global (inject to html top element)
 */
export const GlobalStyle: StyleComponent = (props, state, [styleOrFunc]) => {
  markHasOutsideEffect();

  connectStyleSheet({
    props: { ...props, scoped: false },
    styleOrFunc,
    rootNodeSelector: ":root",
  });
  return () => null;
};
