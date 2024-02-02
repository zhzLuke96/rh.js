import { readonly, ref, untrack } from "@rhjs/observable";

export type StateMutator<T> = {
  (mutate: (x: T) => T): void;
  (value: T): void;
};
export type StateOptions<T> = {
  equals?: false | ((a: T, b: T) => boolean);
};
export function createState<T>(initialState: T, options?: StateOptions<T>) {
  const comparator = options?.equals;
  const stateRef = ref(initialState);
  const mutator: StateMutator<T> = (valueOrMutate: any) => {
    const currentValue = untrack(stateRef);
    const nextValue =
      typeof valueOrMutate === "function"
        ? valueOrMutate(currentValue)
        : valueOrMutate;
    if (comparator && comparator(currentValue as T, nextValue)) {
      return;
    }
    stateRef.value = nextValue;
  };
  return [readonly(stateRef), mutator] as const;
}
