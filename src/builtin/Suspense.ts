import { ref } from '@vue/reactivity';
import {
  Component,
  InlineRender,
  rh,
  onCatch,
  View,
  useCurrentView,
  weakMount,
} from '../core/core';

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
  component?: Component;
  render?: InlineRender;
  fallback: InlineRender;
  error?: InlineRender;
}) => {
  const state = ref<PromiseState>('pending');

  onCatch(async (value) => {
    if (isPromise(value)) {
      state.value = 'pending';
      value.then(() => (state.value = 'fulfilled'));
      value.catch(() => (state.value = 'rejected'));
    }
  });

  const anchor = weakMount(() =>
    component ? rh(component) : render ? rh(() => render) : null
  );

  return () => {
    switch (state.value) {
      case 'pending':
        return fallback();
      case 'fulfilled':
        return anchor;
      case 'rejected':
        return (error || fallback)();
    }
  };
};
