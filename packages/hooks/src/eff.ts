import { effect, skip } from "@rhjs/observable";
import { ObservableEffectOptions, ObservableEffect } from "@rhjs/observable";
import { EventOff } from "./lifeCycle";
import { onCleanup } from "./lifeCycle";

export type EffectHandler = {
  runner: ObservableEffect;
  cleanup: () => void;
};
export const createEffect = (
  fn: (onCleanup: (callback: () => any) => any) => any,
  options?: ObservableEffectOptions
): EffectHandler => {
  let cleanupCallback: any;
  const runner = effect(
    () => {
      cleanupCallback && skip(cleanupCallback);
      cleanupCallback = undefined;
      fn((callback) => (cleanupCallback = callback));
    },
    {
      lazy: false,
      ...options,
    }
  );
  let eventOff: EventOff | undefined;
  const cleanup = () => {
    eventOff?.();
    cleanupCallback?.();
    cleanupCallback = undefined;
    runner.stop();
  };
  eventOff = onCleanup(cleanup);
  return { runner, cleanup };
};
