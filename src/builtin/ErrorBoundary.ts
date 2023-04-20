import { ref } from '@vue/reactivity';
import { source_stack } from '../ComponentSource';
import { unskip } from '../reactivity';
import { rh, rhElem } from '../rh';

/**
 * Error Boundary
 */
export const ErrorBoundary = rh.component({
  setup({
    fallbackRender,
    onError,
    render,
  }: {
    fallbackRender: (error: Error, rerender: () => any) => rhElem;
    onError?: (error: Error) => void;
    render: () => rhElem;
  }) {
    const self_source = source_stack.peek();
    let catchError = ref(null as null | Error);
    self_source?.on('throw', (detail: any) => {
      if (detail instanceof Error) {
        onError?.(detail);
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
  render({ fallbackRender, rerenderRef, catchError, childrenRender }) {
    [rerenderRef.value];
    const rerender = () => {
      rerenderRef.value = Date.now();
      catchError.value = null;
    };
    if (catchError.value) {
      return unskip(() => fallbackRender(catchError.value!, rerender));
    }
    return childrenRender();
  },
});
