import { shallowRef, toRaw, Ref, unref } from '@vue/reactivity';
import { Fragment } from './Fragment';
import * as equal from 'fast-deep-equal';
import {
  untrack,
  useElementSource,
  setupEffect,
  skip,
  onMount,
} from '../core/hooks';
import { rh } from '../core/reactiveHydrate';
import { ElementSource } from '../core/ElementSource';
import { clonePlainDeep } from '../common/clonePlainDeep';
import { globalIdleScheduler } from '../common/IdleScheduler';

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

  const itemRender = async (
    ...args: Parameters<ReactiveListProps<T>['render']>
  ) =>
    globalIdleScheduler.runTask(() => {
      ElementSource.source_stack.push(es);
      try {
        return render(...args);
      } finally {
        ElementSource.source_stack.pop();
      }
    });

  let taskTimestamp = 0;
  const childrenRender = async (items: T[], trigger: () => void) => {
    let renderTaskTS = (taskTimestamp = Date.now());
    const isDeprecated = () => renderTaskTS < taskTimestamp;

    const itemNodes = untrack(itemNodesRef);
    for (let idx = 0; idx < Math.max(itemNodes.length, items.length); idx++) {
      const itemNode = itemNodes[idx];
      const item = items[idx];
      if (itemNode !== undefined && item !== undefined) {
        if (!itemNode.node || skip(() => needUpdate(item, itemNode.data))) {
          const next = await itemRender(
            item,
            idx,
            items,
            trigger,
            itemNode.node
          );
          if (isDeprecated()) return;
          itemNode.node = next;
          itemNode.data = snapshotRaw(item);
        }
      } else if (itemNode === undefined) {
        const node = await itemRender(item, idx, items, trigger);
        if (isDeprecated()) return;
        itemNodes.push({ data: snapshotRaw(item), node });
      } else if (item === undefined) {
        itemNode.del = true;
      }
    }
    const nextItemNodes = itemNodes.filter((x) => x.del !== true);
    itemNodesRef.value = nextItemNodes;
  };

  const [runner] = setupEffect(
    () => {
      const items =
        typeof getItems === 'function' ? getItems() : unref(getItems);
      childrenRender(items, () => runner?.effect.run());
    },
    { lazy: true }
  );

  globalIdleScheduler.runTask(() => runner());

  return () =>
    rh(Fragment, {}, () =>
      itemNodesRef.value.filter((x) => !x.del).map((x) => x.node)
    );
};
