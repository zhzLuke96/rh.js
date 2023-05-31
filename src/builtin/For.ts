import { isRef, shallowRef, unref } from '@vue/reactivity';
import {
  createEffect,
  createMemo,
  InlineRenderResult,
  MaybeRefOrGetter,
  untrack,
} from '../core/core';
import { shallowEqual } from '../common/shallowEqual';

const deepClone = (x: any) => JSON.parse(JSON.stringify(x));

export const For = <T>(
  { each }: { each: MaybeRefOrGetter<T[]> },
  state: any,
  [render]: [
    (
      item: T,
      index: number,
      array: T[],
      flush: () => void
    ) => InlineRenderResult
  ]
) => {
  const items = createMemo<T[]>(() =>
    isRef(each)
      ? unref(each)
      : typeof each === 'function'
      ? (<any>each)()
      : each
  );
  const itemsView = shallowRef<
    {
      item: T;
      view: InlineRenderResult;
    }[]
  >([]);
  const { runner: effectRunner } = createEffect(() => {
    const nextItemsView = [] as {
      item: T;
      view: InlineRenderResult;
    }[];
    const itemsValue = unref(items);
    for (let index = 0; index < itemsValue.length; index++) {
      const item = itemsValue[index];
      const view = untrack(itemsView)[index];

      if (view && shallowEqual(item, view.item)) {
        nextItemsView.push(view);
        continue;
      }
      nextItemsView.push({
        item: deepClone(item),
        view: render(item, index, itemsValue, () => effectRunner?.()),
      });
    }
    itemsView.value = nextItemsView;
  });
  return () => itemsView.value.map((x) => x.view);
};
