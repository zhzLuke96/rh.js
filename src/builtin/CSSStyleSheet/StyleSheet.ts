import { parseCSSProps } from './parseCSSProps';

type CSSProperties = Partial<CSSStyleDeclaration>;

export type NestedCSSProperties = CSSProperties & {
  [k: string]: NestedCSSProperties | CSSProperties[keyof CSSProperties];
};

export const createStyleSheet = (styleFn: () => NestedCSSProperties) => {
  const sheet = new CSSStyleSheet();
  const parseStyle = (rootNode: string) => {
    const cssStyle = styleFn();
    const cssText = parseCSSProps(cssStyle, rootNode);
    sheet.replaceSync(cssText);
  };
  let adopted = false;
  const applySheet = () => {
    if (adopted) {
      return;
    }
    adopted = true;
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  };
  const removeSheet = () => {
    if (!adopted) {
      return;
    }
    adopted = false;
    document.adoptedStyleSheets = [...document.adoptedStyleSheets].filter(
      (x) => x !== sheet
    );
  };

  return {
    sheet,
    parseStyle,
    applySheet,
    removeSheet,
  };
};
