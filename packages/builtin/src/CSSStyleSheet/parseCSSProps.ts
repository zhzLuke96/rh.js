import { NestedCSSProperties } from './StyleSheet';

type ParseCSSPropsOptions = {
  beautify?: boolean;
  scopedSelector?: string;
};

function processSelector(
  selector: string,
  parentSelector: string,
  scopedSelector = ''
) {
  const isRoot = parentSelector === ':root';
  const parent = isRoot ? '' : parentSelector;
  const combine = (arr1: string[], arr2: string[]) =>
    arr1.flatMap((x) => arr2.map((y) => [x, y]));
  const childBlocks = selector
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  let parentBlocks = isRoot
    ? ['']
    : parent
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);

  const allBlocks = combine(childBlocks, parentBlocks);

  const replaceAmpersand = ([child, parent]: string[]) =>
    child.startsWith('&') ? child.replace(/&/g, parent) : `${parent} ${child}`;
  const addScope = (block: string) =>
    `${block.replace(scopedSelector || '', '')}${scopedSelector || ''}`.trim();

  return allBlocks.map(replaceAmpersand).map(addScope).join(',');
}

export function parseCSSProps(
  cssObject: NestedCSSProperties,
  rootNodeSelector: string,
  { beautify = false, scopedSelector = '' }: ParseCSSPropsOptions
) {
  const enter_symbol = beautify ? '\n' : '';
  const stack = [
    { nodeSelector: rootNodeSelector + scopedSelector, cssObject },
  ];
  const cssBlocks = [] as {
    selector: string;
    cssText: string;
  }[];

  while (stack.length > 0) {
    const { nodeSelector, cssObject } = stack.pop()!;
    const block = {
      selector: nodeSelector,
      cssText: '',
    };

    for (const prop in cssObject) {
      const propValue = cssObject[prop];
      if (typeof propValue === 'object') {
        const selector = prop;
        const childNodeSelector = processSelector(
          selector,
          nodeSelector,
          scopedSelector
        );
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
        block.cssText += `${hyphenate(prop)}: ${
          cssObject[prop]
        };${enter_symbol}`;
      }
    }

    if (block.cssText.trim()) {
      cssBlocks.push(block);
    }
  }

  const result = cssBlocks
    .map((cssBlock) => `${cssBlock.selector}{${cssBlock.cssText}}`)
    .join('\n');
  return result.trim();
}

function hyphenate(str: string) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
