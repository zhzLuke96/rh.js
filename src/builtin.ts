import { effect, ref, shallowRef } from '@vue/reactivity';
import { rh, rhElem, warpView } from './rh';

type FragmentChildren = Element | Comment;

const idleRunner = (canRun: () => boolean, runner: () => any) => {
  const innerRunner = () => {
    if (canRun()) {
      runner();
    } else {
      requestIdleCallback(innerRunner);
    }
  };
  innerRunner();
};

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup(props, innerRender: () => Array<rhElem>) {
    const ctx = {
      anchor: document.createTextNode(''),
      children: [] as Array<FragmentChildren>,
    };
    const rerender = () => {
      // *must be called before all returns, because to register to the effect
      const newChildren = innerRender().map(warpView).filter(Boolean);

      const { children: oldChildren, anchor } = ctx;
      const container = anchor.parentElement;
      if (!container) {
        idleRunner(() => !!anchor.parentElement, rerender);
        return;
      }

      const length = Math.max(newChildren.length, oldChildren.length);
      for (let idx = 0; idx < length; idx++) {
        const newOne = newChildren[idx];
        const oldOne = oldChildren[idx];

        if (!newOne && oldOne) {
          oldOne.remove();
        } else if (!oldOne && newOne) {
          container.insertBefore(newOne, anchor);
        } else if (oldOne && newOne) {
          if (oldOne === newOne) {
            continue;
          }
          container.replaceChild(newOne, oldOne);
        }
      }
      ctx.children = newChildren as Array<FragmentChildren>;
    };
    effect(() => {
      rerender();
    });
    return ctx;
  },
  render(ctx) {
    return ctx.anchor;
  },
});

/**
 * TODO quick diff for MapList
 */
function quickDiff<T>(params: {
  new_list: Array<T>;
  old_list: Array<T>;
  is_same_item: (a: T, b: T) => boolean;

  patch: (a: T, b: T) => any;
  mount: (a: T, b: T) => any;
  unmount: (a: T, b: T) => any;
}) {
  // TODO
}

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
  needUpdate = (a: T, b: T) => a !== b,
  ...props
}: MapProps<T>) => {
  // const containerDom = rh(tagName || 'div', props || {});
  const itemNodesRef = shallowRef<
    { data: T; node: HTMLElement; del?: boolean }[]
  >([]);
  const rerender_ref = ref(0);
  const rerender = () => (rerender_ref.value = Date.now());
  effect(() => {
    const items = getItems();
    const itemNodes = itemNodesRef.value;
    for (let idx = 0; idx < Math.max(itemNodes.length, items.length); idx++) {
      const itemNode = itemNodes[idx];
      const item = items[idx];
      if (itemNode !== undefined && item !== undefined) {
        if (!itemNodes[idx].node || needUpdate(item, itemNodes[idx].data)) {
          const prev = itemNodes[idx].node;
          const next = render(item, idx, items);
          itemNodes[idx].node = next;
          itemNodes[idx].data = item;
        }
      } else if (itemNode === undefined) {
        const node = render(item, idx, items);
        itemNodes.push({ data: item, node });
      } else if (item === undefined) {
        itemNode.del = true;
      }
    }
    const nextItemNodes = itemNodes.filter((x) => x.del !== true);
    // TODO 也许可以deep equal一下？
    itemNodesRef.value = nextItemNodes;

    Promise.resolve().then(rerender);
  });
  const innerRender = () =>
    itemNodesRef.value.filter((x) => !x.del).map((x) => x.node);
  return () => rh(Fragment, {}, innerRender as any);
};

/**
 * Portal Component
 */
export const Portal = (
  {
    container: useContainer,
    ...props
  }: { container?: HTMLElement; [K: string]: any },
  ...children: any
) => {
  const marker = document.createTextNode('');

  const container: HTMLElement = useContainer || document.createElement('div');
  if (!useContainer) {
    document.body.appendChild(container);
  }
  rh(container, props, ...children);

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
  render({ props, container }, ...children) {
    return rh(container, props, ...children);
  },
});
