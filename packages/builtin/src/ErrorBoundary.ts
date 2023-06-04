import { ref } from "@rhjs/core";
import {
  component,
  InlineRender,
  InlineRenderResult,
  onError,
  skip,
} from "@rhjs/core";

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
    const rerenderRef = ref(1);
    return {
      catchError,
      rerenderRef,
      fallbackRender,
      childrenRender: render,
    };
  },
  render(_, { fallbackRender, rerenderRef, catchError, childrenRender }) {
    [rerenderRef.value];
    const rerender = () => {
      rerenderRef.value = Date.now();
      catchError.value = null;
    };
    if (catchError.value) {
      return skip(() => fallbackRender(catchError.value!, rerender));
    }
    return childrenRender();
  },
});
