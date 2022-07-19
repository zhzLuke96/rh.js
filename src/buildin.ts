import { effect } from '@vue/reactivity';
import { rh, rhElem, rhView, warpView } from './rh';

const diffItems = <T>(
  prevItems: T[],
  nextItems: T[],
  needUpdate: (a: T, b: T) => boolean
) => {
  // TODO
  // More sophisticated, efficient and accurate data diff algorithms
  // ( maybe like vue3 )
  // return [{insert before}, {insert after}, {delete}, {append}];
};

interface MapProps<T> {
  getItems: () => T[];
  render: (item: T, idx: number, arr: T[]) => HTMLElement;
  tagName?: string;
  needUpdate?: (a: T, b: T) => boolean;
  [K: string]: any; // props
}

/**
 * MapList Component
 *
 * diff render for list data
 */
export const MapList = <T>({
  getItems,
  render,
  tagName = 'div',
  needUpdate = (a: T, b: T) => a !== b,
  ...props
}: MapProps<T>) => {
  const containerDom = rh(tagName || 'div', props || {});
  let itemNodes = [] as { data: T; node: HTMLElement; del?: boolean }[];
  effect(() => {
    const items = getItems();
    for (let idx = 0; idx < Math.max(itemNodes.length, items.length); idx++) {
      const itemNode = itemNodes[idx];
      const item = items[idx];
      if (itemNode !== undefined && item !== undefined) {
        if (!itemNodes[idx].node || needUpdate(item, itemNodes[idx].data)) {
          const prev = itemNodes[idx].node;
          const next = render(item, idx, items);
          if (prev) {
            containerDom.replaceChild(next, prev);
          } else {
            containerDom.appendChild(next);
          }
          itemNodes[idx].node = next;
          itemNodes[idx].data = item;
        }
      } else if (itemNode === undefined) {
        const node = render(item, idx, items);
        itemNodes.push({ data: item, node });
        containerDom.appendChild(node);
      } else if (item === undefined) {
        containerDom.removeChild(itemNode.node);
        itemNode.del = true;
      }
    }
    itemNodes = itemNodes.filter((x) => x.del !== true);
  });
  return () => containerDom;
};

/**
 * Portal Component
 */
export const Portal = (
  {
    contianer: useContainer,
    ...props
  }: { container?: HTMLElement; [K: string]: any },
  ...childs: any
) => {
  const marker = document.createTextNode('');

  const container: HTMLElement = useContainer || document.createElement('div');
  if (!useContainer) {
    document.body.appendChild(container);
  }
  rh(container, props, ...childs);

  marker.addEventListener('cleanup', () => {
    container.parentElement?.removeChild(container);
  });
  container.addEventListener('rh-err', (ev: any) => {
    marker.dispatchEvent(
      new CustomEvent('rh-err', {
        detail: ev.detail,
        bubbles: true,
        composed: false,
      })
    );
    ev.stopPropagation();
  });

  return () => marker;
};

/**
 * Error Boundary
 */

export const ErrorBoundary = rh.component({
  setup({
    tagName = 'div',
    fallback,
    onError,
    ...props
  }: {
    tagName?: string;
    fallback?: Element;
    onError?: (error: Error) => void;
    [K: string]: any;
  }) {
    const container = document.createElement(tagName);
    const fallbackNode = fallback || document.createTextNode('');
    container.addEventListener('rh-err', (ev: any) => {
      onError?.(ev.detail);
      container.innerHTML = '';
      container.appendChild(fallbackNode);
    });
    return {
      container,
      props,
    };
  },
  render({ props, container }, ...childs) {
    return rh(container, props, ...childs);
  },
});

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup() {
    return {
      marker: document.createTextNode(''),
      childs: [] as Array<rhView>,
    };
  },
  render(ctx, innerRender: () => Array<rhElem>) {
    // FIXME Side effects should not be written in here!!! (should in setup)
    effect(() => {
      const nextChilds = innerRender().map(warpView);
      ctx.childs.forEach((child) => child?.parentElement?.removeChild(child));
      ctx.childs = nextChilds;
      nextChilds.forEach(
        (child) =>
          child && ctx.marker.parentElement?.insertBefore(child, ctx.marker)
      );
    });
    return ctx.marker;
  },
});
