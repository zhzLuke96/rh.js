import { ref } from "@rhjs/core";
import { component, InlineRender, InlineRenderResult, skip } from "@rhjs/core";
import { createRenderTrigger, onError } from "@rhjs/hooks";

/**
 * Error Boundary
 */
export const ErrorBoundary = component({
  setup({
    fallbackRender,
    onError: _onError,
    render,
  }: {
    fallbackRender: (error: Error, rerender: () => any) => InlineRenderResult;
    onError?: (error: Error) => void;
    render: InlineRender;
  }) {
    let catchError = ref(null as null | Error);
    onError((detail) => {
      if (detail instanceof Error) {
        _onError?.(detail);
        catchError.value = detail;
      }
    });
    const rerender = createRenderTrigger();
    return {
      catchError,
      rerender,
      fallbackRender,
      childrenRender: render,
    };
  },
  render(
    _,
    { fallbackRender, rerender: _rerender, catchError, childrenRender }
  ) {
    if (catchError.value) {
      return skip(() =>
        fallbackRender(catchError.value!, () => {
          catchError.value = null;
          _rerender();
        })
      );
    }
    return childrenRender();
  },
});
