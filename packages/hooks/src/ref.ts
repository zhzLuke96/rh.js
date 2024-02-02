import { Ref, ref } from "@rhjs/observable";

export function createRef<T>(initial: T): Ref<T>;
export function createRef<T>(initial: T) {
  return ref(initial);
}
