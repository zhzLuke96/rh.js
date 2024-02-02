import type { InlineRenderResult, FC } from "@rhjs/core";
import { unref, UnwrapRef, MaybeRef } from "@rhjs/observable";
import { rh } from "@rhjs/core";
import { createMemo } from "@rhjs/hooks";

/**
 * @deprecated just use `rh('div', null, () => { ... })` not need `memoView`
 */
export function memoView<T extends UnwrapRef<any>>(
  ref: MaybeRef<T>,
  render: (data: T) => InlineRenderResult
): Node;
export function memoView<T>(
  getter: () => T,
  render: (data: T) => InlineRenderResult
): Node;
export function memoView(
  getterOrRef: any,
  render: (data: any) => InlineRenderResult
): Node {
  return rh(() => {
    const value = createMemo(
      typeof getterOrRef === "function" ? getterOrRef : () => unref(getterOrRef)
    );
    return () => render(unref(value));
  });
}
