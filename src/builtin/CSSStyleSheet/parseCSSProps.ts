import { NestedCSSProperties } from './StyleSheet';

export function parseCSSProps(
  cssObject: NestedCSSProperties,
  rootNodeSelector: string,
  beautify = false
) {
  const enter_symbol = beautify ? '\n' : ' ';
  const stack = [{ nodeSelector: rootNodeSelector, cssObject }];
  let result = '';

  while (stack.length > 0) {
    const { nodeSelector, cssObject } = stack.pop()!;
    result += `${nodeSelector} {${enter_symbol}`;

    for (const prop in cssObject) {
      const propValue = cssObject[prop];
      if (typeof propValue === 'object') {
        const isRootNode = nodeSelector === ':root';
        const childNodeSelector = prop.startsWith('&')
          ? nodeSelector + prop.slice(1).replace(/&/g, nodeSelector)
          : `${isRootNode ? '' : nodeSelector} ${prop}`.trim();
        stack.push({
          nodeSelector: childNodeSelector,
          cssObject: propValue as NestedCSSProperties,
        });
      } else {
        if (typeof propValue === 'string' && !propValue.trim()) {
          continue;
        }
        if (propValue === null || propValue === undefined) {
          continue;
        }
        result += `${hyphenate(prop)}: ${cssObject[prop]};${enter_symbol}`;
      }
    }

    result += `}\n`;
  }

  return result.trim();
}

function hyphenate(str: string) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
