import { readonly, ref, Ref, skip, untrack } from "@rhjs/core";
import { createEffect } from "./eff";

export type MemoValue<T> = {
  readonly value: T;
} & Ref<T>;

export function createMemo<T>(
  memoFn: (onCleanup: (callback: () => any) => any) => T
): MemoValue<T> {
  let cleanup: any;
  const valueRef = ref<any>();
  createEffect(() => {
    cleanup && skip(cleanup);
    cleanup = undefined;

    const value = memoFn((callback) => {
      const _cleanup = cleanup;
      // FILO cleanup like golang defer
      cleanup = () => {
        callback();
        _cleanup?.();
      };
    });

    if (Object.is(value, untrack(valueRef))) {
      return;
    }
    valueRef.value = value;
  });
  return readonly(valueRef);
}
