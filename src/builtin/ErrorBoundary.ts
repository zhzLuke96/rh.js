import { ref } from '@vue/reactivity';
import { component } from '../core/component';
import { skip } from '../core/hooks';
import { ElementView } from '../core/types';
import { ElementSource } from '../core/ElementSource';

/**
 * Error Boundary
 */
export const ErrorBoundary = component({
  setup({
    fallbackRender,
    onError,
    render,
  }: {
    fallbackRender: (error: Error, rerender: () => any) => ElementView;
    onError?: (error: Error) => void;
    render: () => ElementView;
  }) {
    const self_source = ElementSource.peek();
    let catchError = ref(null as null | Error);
    self_source.on('throw', (detail: any) => {
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
