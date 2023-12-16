import {
  pauseTracking,
  resetTracking,
  enableTracking,
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

export const unrefx = <T>(target: T): T extends { value: infer P } ? P : T =>
  (target as any)?.value;

export const untrack = <T>(value: MaybeRefOrGetter<T>): T =>
  typeof value === 'function' ? skip(value as any) : (skip(unrefx, value) as T);
