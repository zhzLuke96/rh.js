import { hookEffect } from '../ComponentSource';

type CSSProperties = Partial<CSSStyleDeclaration>;

export type NestedCSSProperties = CSSProperties & {
  [k: string]: NestedCSSProperties | CSSProperties[keyof CSSProperties];
};

function parseStyle(
  css: NestedCSSProperties,
  rootNode: string,
  format = false
) {
  const enter_symbol = format ? '\n' : ' ';
  const stack = [{ node: '.' + rootNode, css: css }];
  let result = '';

  while (stack.length > 0) {
    const { node, css } = stack.pop()!;
    result += `${node} {${enter_symbol}`;

    for (const prop in css) {
      const value = css[prop];
      if (typeof value === 'object') {
        const childNode = prop.startsWith('&')
          ? node + prop.slice(1).replace(/&/g, node)
          : node + ' ' + prop;
        stack.push({ node: childNode, css: value as NestedCSSProperties });
      } else {
        if (typeof value === 'string' && !value.trim()) {
          continue;
        }
        if (value === null || value === undefined) {
          continue;
        }
        result += `${hyphenate(prop)}: ${css[prop]};${enter_symbol}`;
      }
    }

    result += `}\n`;
  }

  return result.trim();
}

function hyphenate(str: string) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
/**
 * reactivity style dom
 */
export function rStyle(cssFn: () => NestedCSSProperties) {
  const className = `__s_${Math.floor(
    Math.random() * Number.MAX_SAFE_INTEGER
  )}`;
  const styleDOM = document.createElement('style');
  hookEffect(() => {
    const css = cssFn();
    styleDOM.innerHTML = parseStyle(css, className);
  });
  return {
    dom: styleDOM,
    className,
  };
}
