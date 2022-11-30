import {
  effect,
  ReactiveEffectOptions,
  enableTracking,
  pauseTracking,
  resetTracking,
} from '@vue/reactivity';

export const skip = <RET = unknown>(fn: () => RET) => {
  pauseTracking();
  const ret = fn();
  resetTracking();
  return ret as RET;
};

export const unskip = <RET = unknown>(fn: () => RET) => {
  enableTracking();
  const ret = fn();
  resetTracking();
  return ret as RET;
};

export const watch = <Value>(
  valueFn: () => Value,
  effectFn: (arg1: Value, prev_value: undefined | Value) => any,
  options?: ReactiveEffectOptions | undefined
) => {
  let prev_value = undefined as undefined | Value;
  effect(() => {
    const val = valueFn();
    skip(() => effectFn(val, prev_value));
    prev_value = val;
  }, options);
};
