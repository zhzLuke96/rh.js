import { isRef, shallowRef, triggerRef, unref } from "@rhjs/core";
import { InlineRenderResult, MaybeRefOrGetter, untrack } from "@rhjs/core";
import { shallowEqual } from "./internal/shallowEqual";
import { clonePlainDeep } from "./internal/clonePlainDeep";
import { createEffect, createMemo } from "@rhjs/hooks";

const defaultNeedUpdate = ({
  index,
  data,
  prev_data,
  array,
  prev_array,
}: {
  index: number;
  data: any;
  prev_data: any;
  array: any[];
  prev_array: any[];
}) => !shallowEqual(data, prev_data) || array.length !== prev_array.length;

export const For = <T>(
  {
    each,
    needUpdate = defaultNeedUpdate,
    snapshotItem = clonePlainDeep,
  }: {
    each: MaybeRefOrGetter<T[]>;
    needUpdate?: (params: {
      index: number;
      data: T;
      prev_data: T;
      array: T[];
      prev_array: T[];
    }) => boolean;
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
    const prevItems = untrack(itemsViewRef);
    const prevArray = prevItems.map((x) => x.item);
    for (let index = 0; index < itemsValue.length; index++) {
      const item = itemsValue[index];
      const view = prevItems[index];

      if (
        view &&
        !needUpdate({
          index,
          data: item,
          prev_data: view.item,
          array: itemsValue,
          prev_array: prevArray,
        })
      ) {
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
