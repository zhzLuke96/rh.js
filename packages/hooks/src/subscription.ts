import { readonly, Ref, shallowRef, skip, untrack } from "@rhjs/core";
import { createEffect } from "./eff";

export type SubscribedValue<T> = {
  readonly value: T;
} & Ref<T>;

export function createSubscription<T, ARGS extends any[] = any[]>(
  subscribe: (listener: (...args: ARGS) => any) => () => void,
  getSnapshot: (...args: ARGS | []) => T,
  {
    equals = Object.is,
  }: {
    equals?: false | ((a: T, b: T) => boolean);
  } = {}
): SubscribedValue<T> {
  const valueRef = shallowRef<any>();
  // like createWatcher but less call stack
  createEffect((onCleanup) => {
    valueRef.value = getSnapshot();
    const cleanup = subscribe((...args: ARGS) => {
      const nextValue = skip(() => getSnapshot(...args));
      const oldValue = untrack(valueRef);
      if (equals && equals(nextValue, oldValue)) {
        return;
      }
      valueRef.value = nextValue;
    });
    onCleanup(cleanup);
  });
  return readonly(valueRef);
}
