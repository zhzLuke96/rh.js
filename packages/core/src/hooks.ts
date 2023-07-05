import {
  effect,
  isRef,
  pauseTracking,
  ReactiveEffectOptions,
  ReactiveEffectRunner,
  readonly,
  ref,
  Ref,
  resetTracking,
  shallowRef,
  triggerRef,
  unref,
  UnwrapRef,
} from '@vue/reactivity';
import {
  View,
  MaybeRefOrGetter,
  ViewEvent,
  ViewComponent,
  DOMView,
  MaybeRef,
  InlineRenderResult,
  rh,
  FunctionComponent,
} from './core';

export const useCurrentView = () => View.topView();

export function skip<T, ARGS extends any[]>(
  fn: (...args: ARGS) => T,
  ...args: ARGS
) {
  pauseTracking();
  try {
    return fn.apply(undefined, args);
  } finally {
    resetTracking();
  }
}
export const untrack = <T>(value: MaybeRefOrGetter<T>): T =>
  typeof value === 'function' ? skip(value as any) : (skip(unref, value) as T);
type EventOff = () => any;
export const onViewEvent = <Event extends keyof ViewEvent>(
  event: Event,
  fn: ViewEvent[Event],
  once = false
): EventOff => {
  const view = View.topView();
  view.events[once ? 'once' : 'on'](event, fn as any);
  return () => view.events.off(event, fn as any);
};
const createOnEvent =
  <Event extends keyof ViewEvent>(event: Event, once = false) =>
  (fn: ViewEvent[Event]) =>
    onViewEvent(event, fn, once);
export const onMounted = createOnEvent('mounted');
export const onBeforeMount = createOnEvent('mount_before');
export const onAfterMount = createOnEvent('mount_after');
export const onUnmounted = createOnEvent('unmounted');
export const onBeforeUnmount = createOnEvent('unmount_before');
export const onAfterUnmount = createOnEvent('unmount_after');
export const onUpdated = createOnEvent('updated');
export const onBeforeUpdate = createOnEvent('update_before');
export const onAfterUpdate = createOnEvent('update_after');
export const onBeforePatch = createOnEvent('patch_before');
export const onAfterPatch = createOnEvent('patch_after');
export const onError = createOnEvent('error');
export const onCatch = createOnEvent('throw');
// component event

export const onRenderStop = createOnEvent('render_stop');
export const onRenderTracked = createOnEvent('render_tracked');
export const onRenderTriggered = createOnEvent('render_triggered');

export const createRenderTrigger = () => {
  const view = View.topView();
  const component = ViewComponent.view2component.get(view);
  if (!component) {
    throw new Error(
      'No component found, please call createRenderTrigger in component setup function'
    );
  }
  return () => component.runner();
};

export const onCleanup = (callback: () => any): EventOff => {
  const view = View.topView();
  if (view.zoneFlag === 'render') {
    const eventOff = () => {
      view.events.off('update_before', handler);
      view.events.off('unmounted', handler);
    };
    const handler = () => {
      // only call once
      eventOff();
      callback();
    };
    view.events.once('update_before', handler);
    view.events.once('unmounted', handler);
    return eventOff;
  } else {
    view.events.once('unmounted', callback);
    return () => view.events.off('unmounted', callback);
  }
};

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
type StateMutator<T> = {
  (value: T): void;
  (mutate: (x: T) => T): void;
};
export function createState<T>(
  initialState: T,
  options?: {
    equals?: false | ((a: T, b: T) => boolean);
  }
) {
  const comparator = options?.equals;
  const stateRef = shallowRef(initialState);
  const mutator: StateMutator<T> = (valueOrMutate: any) => {
    const currentValue = untrack(stateRef);
    const nextValue =
      typeof valueOrMutate === 'function'
        ? valueOrMutate(currentValue)
        : valueOrMutate;
    if (comparator && comparator(currentValue, nextValue)) {
      return;
    }
    stateRef.value = nextValue;
    triggerRef(stateRef);
  };
  return [readonly(stateRef), mutator] as const;
}
export function createSignal<T>(
  initialValue: T,
  options?: {
    equals?: false | ((a: T, b: T) => boolean);
  }
) {
  const [state, setSignal] = createState(initialValue, options);
  return [() => unref(state), setSignal] as const;
}

export function createWatcher<T>(
  targetRef: Ref<T>,
  callback: (
    value: T | undefined,
    prev: T | undefined,
    onCleanup: (callback: () => any) => any
  ) => any,
  options?: ReactiveEffectOptions
): EffectHandler;
export function createWatcher<T>(
  getter: () => T,
  callback: (
    value: T,
    prev: T | undefined,
    onCleanup: (callback: () => any) => any
  ) => any,
  options?: ReactiveEffectOptions
): EffectHandler;
export function createWatcher(
  getterOrRef: any,
  callback: (
    value: any,
    prev: any,
    onCleanup: (callback: () => any) => any
  ) => any,
  options?: ReactiveEffectOptions
): EffectHandler {
  let value: any;
  return createEffect((onCleanup) => {
    const nextValue = isRef(getterOrRef) ? getterOrRef.value : getterOrRef();
    skip(callback, nextValue, value, onCleanup);
    value = nextValue;
  }, options);
}

export type SubscribedValue<T> = {
  readonly value: T;
} & Ref<T>;

export function createSubscription<T>(
  subscribe: (listener: () => any) => () => void,
  getSnapshot: () => T
): SubscribedValue<T> {
  const valueRef = ref<any>(getSnapshot());
  const offListener = subscribe(() => {
    const nextValue = getSnapshot();
    if (Object.is(nextValue, unref(valueRef))) {
      return;
    }
    valueRef.value = nextValue;
  });
  onMounted(offListener);
  return readonly(valueRef);
}
type ResourceFetcher<T, ARGS extends any[] = any[]> = (
  ...args: ARGS
) => PromiseLike<T>;

export function createResource<T, ARGS extends any[] = any[]>(
  fetcher: ResourceFetcher<T, ARGS>,
  options?: {
    onError?: (err?: any) => any;
    onSuccess?: (value: T) => any;
    initialData?: T;
  }
) {
  const [data, mutate] = createState<T | undefined>(options?.initialData);

  const fetching = ref(false);
  const enabled = ref(true);
  const error = ref<any>(null);

  const refetch = async (...args: ARGS) => {
    if (untrack(fetching)) {
      return;
    }
    if (!untrack(enabled)) {
      return;
    }
    try {
      fetching.value = true;
      const result = await fetcher(...args);
      mutate(result);
      options?.onSuccess?.(result);
    } catch (err) {
      error.value = err;
      options?.onError?.(err);
      console.error(err);
    } finally {
      fetching.value = false;
    }
  };

  return [
    data,
    {
      mutate,
      refetch,
      fetching,
      enabled,
      error,
    },
  ] as const;
}

export type MemoValue<T> = {
  readonly value: T;
} & Ref<T>;

export function createMemo<T>(
  memoFn: (onCleanup: (callback: () => any) => any) => T
): MemoValue<T> {
  let cleanupCallback: any;
  const valueRef = ref<any>();
  createEffect(() => {
    cleanupCallback && skip(cleanupCallback);
    cleanupCallback = undefined;

    const value = memoFn((callback) => (cleanupCallback = callback));

    if (Object.is(value, untrack(valueRef))) {
      return;
    }
    valueRef.value = value;
  });
  return readonly(valueRef);
}

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
  initialState: State
): [ReducerStateValue<State>, ReducerDispatch<Action>] {
  const state = ref<State>(initialState);
  const dispatch = (action: Action): void => {
    state.value = reducer(untrack(state) as any, action) as any;
  };
  return [readonly(state), dispatch] as any;
}

export type DirectiveCleanup = () => any;
export type DirectiveCallback = (
  node: Node,
  value: any,
  view: DOMView
) => void | DirectiveCleanup;
export type DirectiveDefine = {
  key: string;
  mounted?: DirectiveCallback;
  unmounted?: DirectiveCallback;
  updated?: DirectiveCallback;
};

export function enableDirective(directive: DirectiveDefine) {
  const sym = View.symbols.DIRECTIVES;
  const view = View.topView();
  let directives = view.getContextValue(sym);
  if (View.isNone(directives)) {
    directives = {};
  }
  directives[directive.key] = directive;
  view.setContextValue(sym, directives);
}

export function disableDirective(key: string) {
  const sym = View.symbols.DIRECTIVES;
  const view = View.topView();
  let directives = view.getContextValue(sym);
  if (View.isNone(directives)) {
    directives = {};
  }
  // overwrite directive that current layer
  directives[key] = { key };
  view.setContextValue(sym, directives);
}

export function markHasOutsideEffect() {
  const view = View.topView();
  if (view.zoneFlag !== 'setup') {
    console.warn(
      `Warning: Marking a component with outside effect outside "setup" zone may cause unexpected behavior.`
    );
  }
  view.has_outside_effect = true;
}

export function weakMount(render: () => Node | null | undefined | void) {
  const currentView = View.topView();
  const node = render();
  const nodeView = node && View.dom2view.get(node);
  const parentElement = document.createElement('div');
  if (nodeView) {
    nodeView.parentView = currentView;
    nodeView.mount(parentElement);
    if (currentView.zoneFlag === 'render') {
      onBeforeUpdate(() => nodeView?.unmount());
    } else {
      onUnmounted(() => nodeView?.unmount());
    }
  }
  return node;
}

export const provide = <T>(key: keyof any, value: T) => {
  const view = View.topView();
  view.setContextValue(key, value);
};
export function inject<T>(key: keyof any): T | undefined;
export function inject<T>(key: keyof any, defaultValue: T): T;
export function inject(key: keyof any, defaultValue: any = View.symbols.NONE) {
  const view = View.topView();
  const value = view.getContextValue(key);
  if (value === View.symbols.NONE) {
    if (defaultValue !== View.symbols.NONE) {
      return defaultValue;
    }
  }
  return value;
}

const contextIdSymbol = Symbol('context_id');
type Context<T = unknown> = {
  [contextIdSymbol]: symbol;
  defaultValue: T;
  Provider: FunctionComponent<{ value: T }>;
};

export function createContext<T>(defaultValue: T): Context<T>;
export function createContext(defaultValue?: any) {
  const id = Symbol();
  const ctx: Context = {
    [contextIdSymbol]: id,
    defaultValue,
    Provider: (props, state, children) => {
      provide(id, props.value);
      return () => children;
    },
  };
  return ctx;
}

export function injectContext<T>(ctx: Context<T>): T | undefined;
export function injectContext<T>(ctx: Context<T>, defaultValue: T): T;
export function injectContext<T>(ctx: Context<T>, defaultValue?: T) {
  return inject(ctx[contextIdSymbol], defaultValue);
}

export function memoView<T extends UnwrapRef<any>>(
  ref: MaybeRef<T>,
  render: (data: T) => InlineRenderResult
): Node;
export function memoView<T>(
  getter: () => T,
  render: (data: T) => InlineRenderResult
): Node;
export function memoView(
  getterOrRef: any,
  render: (data: any) => InlineRenderResult
): Node {
  return rh(() => {
    const value = createMemo(
      typeof getterOrRef === 'function' ? getterOrRef : () => unref(getterOrRef)
    );
    return () => render(unref(value));
  });
}
type AsyncRender<ARGS extends any[]> = (
  ...args: ARGS
) => AsyncGenerator<InlineRenderResult, InlineRenderResult>;
export function asyncView<ARGS extends any[]>(
  asyncRender: AsyncRender<ARGS>,
  ...args: ARGS
) {
  return rh(() => {
    markHasOutsideEffect();

    const viewRef = ref<InlineRenderResult>();
    let isUnmounted = false;
    skip(async () => {
      const iter = asyncRender(...args);
      for await (const view of iter) {
        if (isUnmounted) {
          return;
        }
        viewRef.value = view;
        // default wait next tick
        await new Promise((resolve) => setTimeout(resolve));
      }
    });
    onUnmounted(() => (isUnmounted = true));
    return () => unref(viewRef);
  });
}
type UnRefArray<T extends any[]> = {
  [K in keyof T]: UnwrapRef<T[K]>;
};

export const depend = <Args extends any[]>(...args: Args) =>
  args.map((x) => unref(x)) as UnRefArray<Args>;

export const unrefAll = depend;

export const untrackAll = <Args extends any[]>(...args: Args) =>
  args.map((x) => untrack(x)) as UnRefArray<Args>;
