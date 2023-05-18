import { shallowRef, toRaw, Ref, unref } from '@vue/reactivity';
import { Fragment } from './Fragment';
import * as equal from 'fast-deep-equal';
import {
  untrack,
  rh,
  useElementSource,
  setupEffect,
  skip,
  setupWatch,
} from '../core/reactiveHydrate';
import { ElementSource } from '../core/ElementSource';
import { clonePlainDeep } from '../common/clonePlainDeep';

interface ReactiveListProps<T> {
  items: (() => T[]) | Ref<T[]>;
  render: (
    item: T,
    idx: number,
    arr: T[],
    trigger: () => void,
    elem?: HTMLElement
  ) => HTMLElement;
  tagName?: string;
  needUpdate?: (a: T, b: T) => boolean;
  [K: string]: any; // props
}

const snapshotRaw = <T>(x: T): T => {
  const raw = toRaw(x);
  return clonePlainDeep(raw) as T;
};

/**
 * ReactiveList Component
 *
 * diff render for list data
 */
export const ReactiveList = <T>({
  items: getItems,
  render,
  needUpdate = ((a: T, b: T) => !((equal as any)?.default || equal)(a, b)) as (
    a: T,
    b: T
  ) => boolean,
}: ReactiveListProps<T>) => {
  const itemNodesRef = shallowRef<
    { data: T; node: HTMLElement; del?: boolean }[]
  >([]);

  const es = useElementSource();

  const childrenRender = (items: T[], trigger: () => void) => {
    const itemNodes = untrack(itemNodesRef);
    for (let idx = 0; idx < Math.max(itemNodes.length, items.length); idx++) {
      const itemNode = itemNodes[idx];
      const item = items[idx];
      if (itemNode !== undefined && item !== undefined) {
        if (!itemNode.node || skip(() => needUpdate(item, itemNode.data))) {
          const next = render(item, idx, items, trigger, itemNode.node);
          itemNode.node = next;
          itemNode.data = snapshotRaw(item);
        }
      } else if (itemNode === undefined) {
        const node = render(item, idx, items, trigger);
        itemNodes.push({ data: snapshotRaw(item), node });
      } else if (item === undefined) {
        itemNode.del = true;
      }
    }
    const nextItemNodes = itemNodes.filter((x) => x.del !== true);
    itemNodesRef.value = nextItemNodes;
  };

  const [runner] = setupEffect(() => {
    const items = typeof getItems === 'function' ? getItems() : unref(getItems);
    ElementSource.source_stack.push(es);
    try {
      childrenRender(items, () => runner.effect.run());
    } finally {
      ElementSource.source_stack.pop();
    }
  });

  return () =>
    rh(Fragment, {}, () =>
      itemNodesRef.value.filter((x) => !x.del).map((x) => x.node)
    );
};
