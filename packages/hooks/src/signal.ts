import { unref } from "@rhjs/core";
import { StateOptions, createState } from "./state";

export function createSignal<T>(initialValue: T, options?: StateOptions<T>) {
  const [state, mutate] = createState(initialValue, options);
  return [() => unref(state), mutate] as const;
}
