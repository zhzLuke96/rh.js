import { isRef, ObservableEffectOptions, Ref, skip } from "@rhjs/observable";
import { EffectHandler, createEffect } from "./eff";

export type WatcherCallback<Value, Prev> = (
  value: Value,
  prev: Prev,
  onCleanup: (callback: () => any) => any
) => any;
export function createWatcher<T>(
  targetRef: Ref<T>,
  callback: WatcherCallback<T | undefined, T | undefined>,
  options?: ObservableEffectOptions
): EffectHandler;
export function createWatcher<T>(
  getter: () => T,
  callback: WatcherCallback<T, T | undefined>,
  options?: ObservableEffectOptions
): EffectHandler;
export function createWatcher(
  getterOrRef: any,
  callback: WatcherCallback<any, any>,
  options?: ObservableEffectOptions
): EffectHandler {
  let value: any;
  return createEffect((onCleanup) => {
    const nextValue = isRef(getterOrRef) ? getterOrRef.value : getterOrRef();
    skip(callback, nextValue, value, onCleanup);
    value = nextValue;
  }, options);
}
