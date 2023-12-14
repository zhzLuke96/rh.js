import { readonly, ref, Ref, untrack } from "@rhjs/core";

export interface Reducer<State, Action> {
  (state: State, action: Action): State;
}

export interface ReducerDispatch<Action> {
  (action: Action): void;
}

export type ReducerStateValue<State> = {
  readonly value: State;
} & Ref<State>;
export function createReducer<State, Action>(
  reducer: Reducer<State, Action>,
  initial: State
): [ReducerStateValue<State>, ReducerDispatch<Action>] {
  const state = ref<State>(initial);
  const dispatch = (action: Action): void => {
    state.value = reducer(untrack(state) as any, action) as any;
  };
  return [readonly(state), dispatch] as any;
}
