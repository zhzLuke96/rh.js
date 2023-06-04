import { isRef, shallowRef, triggerRef, unref } from "@rhjs/core";
import {
  createEffect,
  createMemo,
  InlineRenderResult,
  MaybeRefOrGetter,
  untrack,
} from "@rhjs/core";
import { shallowEqual } from "./internal/shallowEqual";
import { clonePlainDeep } from "./internal/clonePlainDeep";

const defaultNeedUpdate = (a: any, b: any) => !shallowEqual(a, b);

export const For = <T>(
  {
    each,
    needUpdate = defaultNeedUpdate,
    snapshotItem = clonePlainDeep,
  }: {
    each: MaybeRefOrGetter<T[]>;
    needUpdate?: (data: T, prev: T) => boolean;
    snapshotItem?: (data: T, index: number, array: T[]) => T;
  },
  state: any,
  [render]: [
    (
      item: T,
      index: number,
      array: T[],
      flush: () => void,
      flushAll: () => void
    ) => InlineRenderResult
  ]
) => {
  const items = createMemo<T[]>(() =>
    isRef(each)
      ? unref(each)
      : typeof each === "function"
      ? (<any>each)()
      : each
  );
  const itemsViewRef = shallowRef<
    {
      item: T;
      view: InlineRenderResult;
    }[]
  >([]);
  const rerender = (index: number) => {
    const itemsValue = untrack(items);
    const item = itemsValue[index];
    itemsViewRef.value[index] = {
      item: snapshotItem(item, index, itemsValue),
      view: render(
        item,
        index,
        itemsValue,
        () => rerender(index),
        () => triggerRef(itemsViewRef)
      ),
    };
    triggerRef(itemsViewRef);
  };
  createEffect(() => {
    const nextItemsView = [] as {
      item: T;
      view: InlineRenderResult;
    }[];
    const itemsValue = unref(items);
    for (let index = 0; index < itemsValue.length; index++) {
      const item = itemsValue[index];
      const view = untrack(itemsViewRef)[index];

      if (view && !needUpdate(item, view.item)) {
        nextItemsView.push(view);
        continue;
      }
      nextItemsView.push({
        item: snapshotItem(item, index, itemsValue),
        view: render(
          item,
          index,
          itemsValue,
          () => rerender(index),
          () => triggerRef(itemsViewRef)
        ),
      });
    }
    itemsViewRef.value = nextItemsView;
  });
  return () => itemsViewRef.value.map((x) => x.view);
};
