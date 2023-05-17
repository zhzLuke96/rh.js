import { ref } from '@vue/reactivity';
import { ComponentDefine, ElementView } from '../core/types';
import { onThrow, rh } from '../core/reactiveHydrate';
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
  const view = component
    ? rh(component)
    : render
    ? rh(() => () => ReactiveElement.warpView(render()))
    : null;
  return () => {
    switch (state.value) {
      case 'pending':
        return fallback();
      case 'fulfilled':
        return view;
      case 'rejected':
        return (error || fallback)();
    }
  };
};
