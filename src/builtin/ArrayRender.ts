import { shallowRef } from '@vue/reactivity';
import { Fragment } from './Fragment';
import { rh } from '../rh';
import { watch } from '../reactivity';
import * as equal from 'fast-deep-equal';

interface MapProps<T> {
  getItems: () => T[];
  render: (item: T, idx: number, arr: T[], elem?: HTMLElement) => HTMLElement;
  tagName?: string;
  needUpdate?: (a: T, b: T) => boolean;
  [K: string]: any; // props
}

/**
 * ArrayRender Component
 *
 * diff render for list data
 */
export const ArrayRender = <T>({
  getItems,
  render,
  needUpdate = ((a: T, b: T) => !((equal as any)?.default || equal)(a, b)) as (
    a: T,
    b: T
  ) => boolean,
}: MapProps<T>) => {
  const itemNodesRef = shallowRef<
    { data: T; node: HTMLElement; del?: boolean }[]
  >([]);

  watch(getItems, (items) => {
    const itemNodes = itemNodesRef.value;
    for (let idx = 0; idx < Math.max(itemNodes.length, items.length); idx++) {
      const itemNode = itemNodes[idx];
      const item = items[idx];
      if (itemNode !== undefined && item !== undefined) {
        if (!itemNode.node || needUpdate(item, itemNode.data)) {
          const next = render(item, idx, items, itemNode.node);
          itemNode.node = next;
          itemNode.data = item;
        }
      } else if (itemNode === undefined) {
        const node = render(item, idx, items);
        itemNodes.push({ data: item, node });
      } else if (item === undefined) {
        itemNode.del = true;
      }
    }
    const nextItemNodes = itemNodes.filter((x) => x.del !== true);
    itemNodesRef.value = nextItemNodes;
  });

  const innerRender = () =>
    itemNodesRef.value.filter((x) => !x.del).map((x) => x.node);

  return () => rh(Fragment, {}, innerRender as any);
};
