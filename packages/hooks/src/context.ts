import { getCurrentView } from "@rhjs/core";
import { View, FunctionComponent } from "@rhjs/core";

export const provide = <T>(key: keyof any, value: T) => {
  const view = getCurrentView();
  view.setContextValue(key, value);
};

export function inject<T>(key: keyof any, defaultValue: T): T;
export function inject<T>(key: keyof any, defaultValue?: any): T {
  const view = getCurrentView();
  const value = view.getContextValue(key);
  if (value === View.symbols.NONE) {
    if (defaultValue !== View.symbols.NONE) {
      return defaultValue;
    }
    throw new Error(
      `inject key ${key.toString()} not found from view context.`
    );
  }
  return value;
}
const contextIdSymbol = Symbol("context_id");
type ContextRaw<T = unknown> = {
  [contextIdSymbol]: symbol;
  defaultValue: T;
  Provider: FunctionComponent<{ value: T }>;
};
type Context<T = unknown> = {
  defaultValue: T;
  Provider: FunctionComponent<{ value: T }>;
};

const is_context = (ctx: any): ctx is ContextRaw =>
  ctx && typeof ctx[contextIdSymbol] === "symbol";

export function createContext<T>(defaultValue: T): Context<T>;
export function createContext(defaultValue?: any) {
  const id = Symbol();
  const ctx: ContextRaw = {
    [contextIdSymbol]: id,
    defaultValue,
    Provider: (props, state, children) => {
      provide(id, props.value);
      return () => children;
    },
  };
  return ctx;
}

export function injectContext<T>(ctx: Context<T>, defaultValue?: T): T {
  if (!is_context(ctx)) {
    throw new Error(
      "injectContext only accept context created by createContext"
    );
  }
  return inject<T>(ctx[contextIdSymbol], defaultValue as T);
}
