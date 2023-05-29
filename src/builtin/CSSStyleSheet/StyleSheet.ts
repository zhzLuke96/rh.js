import { parseCSSProps } from './parseCSSProps';

type CSSProperties = Partial<CSSStyleDeclaration>;

export type NestedCSSProperties = CSSProperties & {
  [k: string]: NestedCSSProperties | CSSProperties[keyof CSSProperties];
};

const isDocumentOrShadowRoot = (
  node: Node
): node is DocumentOrShadowRoot & Node =>
  node &&
  (node.nodeType === Node.DOCUMENT_NODE ||
    node.nodeType === Node.DOCUMENT_FRAGMENT_NODE);

const createStyleSheetHandler = (
  styleFn: () => NestedCSSProperties,
  scopedSelector: string | undefined,
  handlers: {
    updateCSSText: (cssText: string) => any;
    installSheet: (root: Node) => any;
    uninstallSheet: (root: Node) => any;
  }
) => {
  const { updateCSSText, installSheet, uninstallSheet } = handlers;
  const parseStyle = (rootNode: string) => {
    const cssStyle = styleFn();
    const cssText = parseCSSProps(cssStyle, rootNode, { scopedSelector });
    updateCSSText(cssText);
  };
  let installed = false;
  const applySheet = (root: Node) => {
    if (installed) {
      return;
    }
    installed = true;
    installSheet(root);
  };
  const removeSheet = (root: Node) => {
    if (!installed) {
      return;
    }
    installed = false;
    uninstallSheet(root);
  };

  return {
    parseStyle,
    applySheet,
    removeSheet,
  };
};

export const createDOMStyleSheet = (
  styleFn: () => NestedCSSProperties,
  scopedSelector?: string
) => {
  const styleDOM = document.createElement('style');
  const { parseStyle, applySheet, removeSheet } = createStyleSheetHandler(
    styleFn,
    scopedSelector,
    {
      updateCSSText(cssText) {
        styleDOM.innerHTML = cssText;
      },
      installSheet(root) {
        root.insertBefore(styleDOM, root.firstChild);
      },
      uninstallSheet(root) {
        styleDOM.parentNode?.removeChild(styleDOM);
      },
    }
  );

  return {
    styleDOM,
    parseStyle,
    applySheet,
    removeSheet,
  };
};

export const createAdoptedStyleSheet = (
  styleFn: () => NestedCSSProperties,
  scopedSelector?: string
) => {
  const sheet = new CSSStyleSheet();
  const { parseStyle, applySheet, removeSheet } = createStyleSheetHandler(
    styleFn,
    scopedSelector,
    {
      updateCSSText(cssText) {
        sheet.replaceSync(cssText);
      },
      installSheet(root = document) {
        if (!isDocumentOrShadowRoot(root)) {
          return;
        }
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      },
      uninstallSheet(root = document) {
        if (!isDocumentOrShadowRoot(root)) {
          return;
        }
        root.adoptedStyleSheets = [...root.adoptedStyleSheets].filter(
          (x) => x !== sheet
        );
      },
    }
  );

  return {
    sheet,
    parseStyle,
    applySheet,
    removeSheet,
  };
};

export const createStyleSheet = (
  styleFn: () => NestedCSSProperties,
  scopedSelector?: string,
  adopted?: boolean
) => {
  if (adopted) {
    return createAdoptedStyleSheet(styleFn, scopedSelector);
  }
  return createDOMStyleSheet(styleFn, scopedSelector);
};
