import {
  createStyleSheet,
  NestedCSSProperties,
} from "./CSSStyleSheet/StyleSheet";
import { symbols } from "./constants";
import {
  ViewComponent,
  markHasOutsideEffect,
  useContextProxy,
} from "@rhjs/core";
import { FC, View, DomView } from "@rhjs/core";
import {
  createEffect,
  onUnmounted,
  onBeforeMount,
  onMounted,
  onAfterUpdate,
} from "@rhjs/hooks";

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

// wait all view mounted, include view.children
const waitForMounted = async (view: View) => {
  const mounted = view.status === "mounted" || view.status === "unmounted";
  if (mounted) {
    return;
  }
  await new Promise<void>((resolve) => {
    const handler = () => {
      resolve();
      view.events.off("mounted", handler);
      view.events.off("unmounted", handler);
    };
    view.events.once("mounted", handler);
    view.events.once("unmounted", handler);
  });
};
const collectChildrenElements = async (view: View) => {
  await waitForMounted(view);
  await Promise.all(
    view.children.map((child) =>
      View.anchor2view.has(child)
        ? collectChildrenElements(View.anchor2view.get(child)!)
        : Promise.resolve()
    )
  );
  const nextElements = new Set<Element>();
  if (view instanceof DomView) {
    nextElements.add(view.elem as Element);
  }
  for (const child_node of view.children) {
    if (
      child_node instanceof Element &&
      ["style", "script", "template"].every(
        (tag) => child_node.localName !== tag
      )
    ) {
      nextElements.add(child_node);
    }
    const view = View.anchor2view.get(child_node);
    if (!view) {
      continue;
    }
    if (ViewComponent.view2component.has(view)) {
      // ignore view component
      continue;
    }
    // add non-component view children
    const elements = await collectChildrenElements(view);
    for (const node of elements) {
      nextElements.add(node);
    }
  }
  return nextElements;
};

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
  // collectChildrenElements is async function, so we need to use a flag to prevent unmounted
  let unmounted = false;

  const scopedKey = convertToCamelCase(`s-${scopedId}`);

  let parentView: View | null = null;
  let parentNode: Node | null = null;
  let elements = new Set<Element>();

  const installToDOM = (node: any) => {
    if (unmounted) return;
    if (node && "dataset" in node && typeof node["dataset"] === "object") {
      node.dataset[scopedKey] = "";
    }
  };
  const uninstallToDOM = (node: any) => {
    if (node && "dataset" in node && typeof node["dataset"] === "object") {
      delete node.dataset[scopedKey];
    }
  };

  const updateElements = async () => {
    if (!parentView) {
      return;
    }
    const nextElements = await collectChildrenElements(parentView);
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
    unmounted = true;
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
