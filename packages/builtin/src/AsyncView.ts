import type { FC, InlineRenderResult } from "@rhjs/core";
import {
  ref,
  unref,
  skip,
  markHasOutsideEffect,
  View,
  compile,
} from "@rhjs/core";
import { rh } from "@rhjs/core";
import { createEffect, onUnmounted } from "@rhjs/hooks";

type AsyncRender<ARGS extends any[]> = (
  ...args: ARGS
) => AsyncGenerator<InlineRenderResult, InlineRenderResult>;
export function asyncView<ARGS extends any[]>(
  asyncRender: AsyncRender<ARGS>,
  ...args: ARGS
) {
  return rh(() => {
    markHasOutsideEffect();

    const viewRef = ref<InlineRenderResult>();
    let is_unmounted = false;
    skip(async () => {
      const iter = asyncRender(...args);
      while (is_unmounted === false) {
        const children = await iter.next();
        viewRef.value = children.value;
        await new Promise((resolve) => setTimeout(resolve));
      }
    });
    onUnmounted(() => (is_unmounted = true));
    return () => unref(viewRef);
  });
}

export const AsyncView: FC = (props, state, [_async_render]) => {
  let async_render = _async_render as AsyncRender<any[]>;
  const view = new View();

  const status = {
    is_unmounted: false,
    current_iter: null as null | AsyncGenerator<
      InlineRenderResult,
      InlineRenderResult
    >,
  };

  onUnmounted(() => (status.is_unmounted = true));

  const rebuild = async (props: any, state: any) => {
    const iter = async_render(props, state);
    status.current_iter = iter;
    let data: IteratorResult<InlineRenderResult> | null = null;

    const is_done = () => {
      if (status.is_unmounted) {
        return true;
      }
      if (status.current_iter !== iter) {
        return true;
      }
      if (data === null) {
        return false;
      }
      if (data.done) {
        return true;
      }
      return false;
    };

    while (is_done() === false) {
      data = await iter.next();
      if (status.current_iter !== iter) {
        return;
      }
      view.updateChildren(
        Array.isArray(data.value) ? data.value : [data.value]
      );
      // default wait next tick
      await new Promise((resolve) => setTimeout(resolve));
    }
  };
  createEffect(() => rebuild(props, state));

  return (props, state, [_async_render]) => {
    rebuild(props, state);
    return view.anchor;
  };
};
