import {
  ReactiveEffectOptions,
  enableTracking,
  pauseTracking,
  resetTracking,
  ref,
  Ref,
  unref,
  UnwrapRef,
} from '@vue/reactivity';
import { hookEffect } from './ComponentSource';

export * as reactivity from '@vue/reactivity';

export type WeakRef<T> = T | Ref<T>;

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
  valueFn: ((prev_value?: Value) => Value) | Ref<Value>,
  effectFn: (arg1: Value, prev_value: undefined | Value) => any,
  options?: ReactiveEffectOptions | undefined
) => {
  let prev_value = undefined as undefined | Value;
  return hookEffect(() => {
    const val =
      typeof valueFn === 'function' ? valueFn(prev_value) : unref(valueFn);
    skip(() => effectFn(val, prev_value));
    prev_value = val;
  }, options);
};

export const untrack = <Value = unknown>(refObj: Ref<Value> | Value) =>
  skip(() => unref(refObj));

export const computed = <Value = unknown>(
  valueFn: (prev_value?: Value) => Value,
  options?: ReactiveEffectOptions | undefined
) => {
  const computedValue = ref<Value>();
  watch(
    valueFn,
    (val) => {
      computedValue.value = val;
    },
    options
  );
  return computedValue;
};

export const useRef = <Value = unknown>(refObj: Ref<Value>) =>
  [unref(refObj), (next_value: Value) => (refObj.value = next_value)] as const;

type UnRefArray<T extends any[]> = {
  [K in keyof T]: UnwrapRef<T[K]>;
};

export const depend = <Args extends any[]>(...args: Args) =>
  args.map((x) => unref(x)) as UnRefArray<Args>;
