import {
  pauseTracking,
  resetTracking,
  shallowRef,
  enableTracking,
  toRaw,
  Ref,
} from '@vue/reactivity';
import { Fragment } from './Fragment';
import * as equal from 'fast-deep-equal';
import {
  untrack,
  rh,
  useElementSource,
  setupEffect,
  skip,
} from '../core/reactiveHydrate';
import { ElementSource } from '../core/ElementSource';
import { clonePlainDeep } from '../common/clonePlainDeep';

interface MapProps<T> {
  items: (() => T[]) | Ref<T[]>;
  render: (item: T, idx: number, arr: T[], elem?: HTMLElement) => HTMLElement;
  tagName?: string;
  needUpdate?: (a: T, b: T) => boolean;
  [K: string]: any; // props
}

const snapshotRaw = <T>(x: T): T => {
  const raw = toRaw(x);
  return clonePlainDeep(raw) as T;
};

/**
 * ArrayRender Component
 *
 * diff render for list data
 */
export const ArrayRender = <T>({
  items: getItems,
  render,
  needUpdate = ((a: T, b: T) => !((equal as any)?.default || equal)(a, b)) as (
    a: T,
    b: T
  ) => boolean,
}: MapProps<T>) => {
  const itemNodesRef = shallowRef<
    { data: T; node: HTMLElement; del?: boolean }[]
  >([]);

  const es = useElementSource();

  const childrenRender = () => {
    const items = typeof getItems === 'function' ? getItems() : getItems.value;
    const itemNodes = untrack(itemNodesRef);
    for (let idx = 0; idx < Math.max(itemNodes.length, items.length); idx++) {
      const itemNode = itemNodes[idx];
      const item = items[idx];
      if (itemNode !== undefined && item !== undefined) {
        if (!itemNode.node || skip(() => needUpdate(item, itemNode.data))) {
          const next = render(item, idx, items, itemNode.node);
          itemNode.node = next;
          itemNode.data = snapshotRaw(item);
        }
      } else if (itemNode === undefined) {
        const node = render(item, idx, items);
        itemNodes.push({ data: snapshotRaw(item), node });
      } else if (item === undefined) {
        itemNode.del = true;
      }
    }
    const nextItemNodes = itemNodes.filter((x) => x.del !== true);
    itemNodesRef.value = nextItemNodes;
  };

  setupEffect(() => {
    ElementSource.source_stack.push(es);
    try {
      childrenRender();
    } finally {
      ElementSource.source_stack.pop();
    }
  });

  return () =>
    rh(Fragment, {}, () =>
      itemNodesRef.value.filter((x) => !x.del).map((x) => x.node)
    );
};
