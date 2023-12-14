import {
  pauseTracking,
  resetTracking,
  enableTracking,
  unref,
  MaybeRefOrGetter,
} from '@vue/reactivity';

export function skip<T, ARGS extends any[]>(
  fn: (...args: ARGS) => T,
  ...args: ARGS
) {
  pauseTracking();
  try {
    return fn.apply(undefined, args);
  } finally {
    resetTracking();
  }
}
export function unskip<T, ARGS extends any[]>(
  fn: (...args: ARGS) => T,
  ...args: ARGS
) {
  enableTracking();
  try {
    return fn.apply(undefined, args);
  } finally {
    resetTracking();
  }
}

export const untrack = <T>(value: MaybeRefOrGetter<T>): T =>
  typeof value === 'function' ? skip(value as any) : (skip(unref, value) as T);
