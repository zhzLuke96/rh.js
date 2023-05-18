import { ref, shallowRef } from '@vue/reactivity';
import { ComponentDefine, ElementView } from '../core/types';
import { onThrow, rh, setupWatch } from '../core/reactiveHydrate';
import { ReactiveElement } from '../core/ReactiveElement';

type PromiseState = 'pending' | 'fulfilled' | 'rejected';

function isPromise(obj: any): obj is Promise<unknown> {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

export const Suspense = ({
  component,
  render,
  fallback,
  error,
}: {
  component?: ComponentDefine;
  render?: () => ElementView;
  fallback: () => ElementView;
  error?: () => ElementView;
}) => {
  const state = ref<PromiseState>('fulfilled');
  // const promise = shallowRef<null | Promise<any>>(null);
  onThrow(async (value) => {
    if (isPromise(value)) {
      // promise.value = value;
      state.value = 'pending';
      value.then(() => (state.value = 'fulfilled'));
      value.catch(() => (state.value = 'rejected'));
    }
  });

  const anchor = component
    ? rh(component)
    : render
    ? rh(() => () => ReactiveElement.warpView(render()))
    : null;

  // The innerView is used to solve the problem that `update_after` will trigger `unmount`, Suspense will never update, only when Suspense `unmount`, the component will `unmount`
  const innerView = rh(() => () => {
    switch (state.value) {
      case 'pending':
        return fallback();
      case 'fulfilled':
        return anchor;
      case 'rejected':
        return (error || fallback)();
    }
  });

  return () => innerView;
};
