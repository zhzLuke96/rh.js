import {
  effect,
  ReactiveEffectOptions,
  ReactiveEffectRunner,
  skip,
} from "@rhjs/core";
import { EventOff } from "./lifeCycle";
import { onCleanup } from "./lifeCycle";

export type EffectHandler = {
  runner: ReactiveEffectRunner;
  cleanup: () => void;
};
export const createEffect = (
  fn: (onCleanup: (callback: () => any) => any) => any,
  options?: ReactiveEffectOptions
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
    runner.effect.stop();
  };
  eventOff = onCleanup(cleanup);
  return { runner, cleanup };
};
