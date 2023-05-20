import { ElementSource, ElementSourceEventTypes } from './ElementSource';
import { FunctionComponent } from './FunctionComponent';
import { ReactiveDOM } from './ReactiveDOM';
import { SetupComponent } from './SetupComponent';
import {
  effect,
  pauseTracking,
  ReactiveEffectOptions,
  Ref,
  resetTracking,
  stop,
  unref,
  UnwrapRef,
  computed as _computed,
  ComputedGetter,
  DebuggerOptions,
  deferredComputed as _deferredComputed,
  ref,
  isRef,
  enableTracking,
} from '@vue/reactivity';
import {
  AnyRecord,
  ComponentDefine,
  FunctionComponentDefine,
  SetupComponentDefine,
} from './types';
import { symbols } from '../constants';

const isSame = (a: any, b: any) => Object.is(a, b) || a === b;

// element source tools

export function useElementSource(): ElementSource;
export function useElementSource<T>(fn: (es: ElementSource) => T): T;
export function useElementSource<T>(fn?: (es: ElementSource) => T): any {
  return fn ? fn(ElementSource.peek()) : ElementSource.peek();
}

export const addElementSourceListener = <
  K extends keyof ElementSourceEventTypes
>(
  event: K,
  fn: ElementSourceEventTypes[K],
  once = false
) => useElementSource((es) => es[once ? 'once' : 'on'](event, fn));

export const onMount = (fn: () => void) =>
  useElementSource((es) => es.onMount(fn));

export const onUnmount = (fn: () => void) =>
  useElementSource((es) => es.onUnmount(fn));

export const onUpdate = (fn: () => void) =>
  addElementSourceListener('update', fn);

export const onThrow = (fn: (value?: any) => void) =>
  addElementSourceListener('throw', fn);

type ComponentType =
  | FunctionComponent<any, any>
  | SetupComponent<any, any, any>;

const getCachedComponent = (key?: string) => {
  if (!key) {
    return;
  }
  const parent_source = ElementSource.peek();
  const { __container_source } = parent_source;
  if (!__container_source) {
    return;
  }
  __container_source.__context[symbols.CACHE_NODES] ||= {};
  return __container_source.__context[symbols.CACHE_NODES][key];
};

const cacheComponent = (key: string | undefined, component: ComponentType) => {
  if (!key) {
    return;
  }
  const parent_source = ElementSource.peek();
  const { __container_source } = parent_source;
  if (!__container_source) {
    return;
  }
  __container_source.__context[symbols.CACHE_NODES] ||= {};
  __container_source.__context[symbols.CACHE_NODES][key] = component;
};

export const createComponent = (
  define: ComponentDefine<AnyRecord, any[], any>,
  props: Record<keyof any, any> = {},
  children: any[] = []
) => {
  const { key } = props;
  delete props['key'];

  if (key) {
    props['__node_cached'] = true;
  }

  const cachedComponent = getCachedComponent(key);
  if (cachedComponent) {
    return cachedComponent as ComponentType;
  }

  if (typeof define === 'function') {
    const componentInstance = new FunctionComponent(define, props, children);
    cacheComponent(key, componentInstance);
    return componentInstance;
  }
  if (
    typeof define === 'object' &&
    typeof define.render === 'function' &&
    typeof define.setup === 'function'
  ) {
    const componentInstance = new SetupComponent(define, props, children);
    cacheComponent(key, componentInstance);
    return componentInstance;
  }
  throw new Error(
    `Valid define type [${typeof define}] is not supported for reactiveHydrate.`
  );
};

/**
 * A function that creates a component or DOM node from the provided arguments.
 *
 * @param type The type of the component or DOM node to create.
 * - This can be a string, an `Element` instance, a `FunctionComponentDefine` function, or a `SetupComponentDefine` object.
 * @param props An object containing the properties to assign to the created component or DOM node. Optional.
 * @param children An array containing child components or nodes to populate the contents of the created component or DOM node.
 * @returns A `Node` object representing the created component or DOM node.
 */
export const reactiveHydrate = (
  type: string | Element | FunctionComponentDefine | SetupComponentDefine,
  props?: Record<keyof any, any> | null | undefined,
  ...children: any[]
) => {
  // props may be => null
  props ||= {};
  children ||= [];

  children = <any>(children?.flat() || children);
  if (typeof type === 'string' || type instanceof Element) {
    const dom = new ReactiveDOM(type, props, children);
    return dom.node;
  }
  const componentInstance = createComponent(type, props, children);
  componentInstance.ensureEffectRunner();
  return componentInstance.currentView;
};

/**
 * A function that creates a component or DOM node from the provided arguments.
 *
 * ``` ts
 *
 * const node = rh('div', null, rh('span', null, 'Hello world'));
 * console.log(node);
 * // <div><span>Hello world</span></div>
 *
 * ```
 */
export const rh = reactiveHydrate;

type MountFunction = {
  (
    containerOrSelector: Element | string,
    componentDefine: ComponentDefine<AnyRecord, any[], any>,
    props?: Record<keyof any, any>
  ): ComponentType;
  (containerOrSelector: Element | string, element: Element): null;
};

export const mount: MountFunction = (
  containerOrSelector: Element | string,
  componentDefineOrElement: ComponentDefine<AnyRecord, any[], any> | Element,
  props?: Record<keyof any, any>
) => {
  const container =
    containerOrSelector instanceof Element
      ? containerOrSelector
      : document.querySelector(containerOrSelector)!;
  if (!container) {
    throw new Error(`Could not find container: ${containerOrSelector}`);
  }
  if (componentDefineOrElement instanceof Element) {
    container.appendChild(componentDefineOrElement);
    return null as any; // not bad....
  }
  const componentInstance = createComponent(componentDefineOrElement, props);
  componentInstance.ensureEffectRunner();
  container.appendChild(componentInstance.currentView);
  return componentInstance;
};

export const unmount = (
  instance: FunctionComponent<any> | SetupComponent<any, any, any>
) => {
  instance.source.emit('unmount');
  queueMicrotask(() => {
    instance.dispose();
  });
};

export const setupEffect = (
  effectFn: (onCleanup: (callback: () => any) => any) => any,
  options?: Pick<ReactiveEffectOptions, 'onTrack' | 'onTrigger'>
) => {
  let cleanupCallback = null as any;
  const runner = effect(
    () => {
      cleanupCallback?.();
      effectFn((callback) => (cleanupCallback = callback));
    },
    {
      lazy: false,
      ...options,
    }
  );
  const stopEffect = () => {
    cleanupCallback?.();
    stop(runner);
    cleanupCallback = null;
  };
  onUnmount(stopEffect);
  return [runner, stopEffect] as const;
};

export const setupWatch = <Value>(
  valueFn: ((prev_value?: Value) => Value) | Ref<Value>,
  effectFn: (value: Value, prev_value: undefined | Value) => any,
  options?: ReactiveEffectOptions | undefined
) => {
  let value = undefined as undefined | Value;
  return setupEffect(() => {
    const val = typeof valueFn === 'function' ? valueFn(value) : unref(valueFn);
    skip(() => effectFn(val, value));
    value = val;
  }, options);
};

// better then reactivity.computed
export const computed = <T>(
  getter: (previousValue: T | undefined) => T,
  debugOptions?: DebuggerOptions | undefined
) => {
  const value = ref<T>() as Ref<T>;
  setupEffect(() => {
    const previousValue = untrack(value);
    const nextValue = getter(previousValue);
    if (isSame(previousValue, nextValue)) {
      return;
    }
    value.value = nextValue;
  }, debugOptions);
  return value;
};

export const deferredComputed = <T>(getter: ComputedGetter<T>) => {
  const ref = _deferredComputed(getter);
  onUnmount(() => ref.effect.stop());
  return ref;
};

// utils

export const skip = <RET = unknown, ARGS extends any[] = any[]>(
  fn: (...args: ARGS) => RET,
  ...args: ARGS
) => {
  pauseTracking();
  const ret = fn(...args);
  resetTracking();
  return ret as RET;
};

const skipWrap =
  <RET = unknown, ARGS extends any[] = any[]>(fn: (...args: ARGS) => RET) =>
  (...args: ARGS) =>
    skip(fn, ...args);

export const resume = <RET = unknown, ARGS extends any[] = any[]>(
  fn: (...args: ARGS) => RET,
  ...args: ARGS
) => {
  enableTracking();
  const ret = fn(...args);
  resetTracking();
  return ret as RET;
};

export const untrack = <Value = unknown>(refObj: Ref<Value> | Value) =>
  skip(() => unref(refObj));

type UseRefRet<T> = [
  () => T,
  (valueOrUpdateFn: T | ((value: T) => T)) => any,
  Ref<T>
];

export function useRef<T extends object>(refObj: T): UseRefRet<UnwrapRef<T>>;
export function useRef<T>(value: T): UseRefRet<UnwrapRef<T>>;
export function useRef<T = any>(): UseRefRet<T | undefined>;
export function useRef<T>(targetRaw?: T): UseRefRet<T> {
  const target = isRef(targetRaw) ? targetRaw : (ref(targetRaw) as Ref<T>);
  const getter = () => unref(target);
  const setter = (valueOrUpdateFn: T | ((value: T) => T)) => {
    if (typeof valueOrUpdateFn === 'function') {
      const value = untrack(target);
      target.value = (valueOrUpdateFn as any)(value);
    } else {
      target.value = valueOrUpdateFn;
    }
  };
  return [getter, setter, target] as UseRefRet<T>;
}

export const useUntrackRef = <T>(target: Ref<T>) => {
  const [getter, setter] = useRef(target);
  return [skipWrap(getter), skipWrap(setter)] as const;
};

type UnRefArray<T extends any[]> = {
  [K in keyof T]: UnwrapRef<T[K]>;
};

export const depend = <Args extends any[]>(...args: Args) =>
  args.map((x) => unref(x)) as UnRefArray<Args>;

export const unrefAll = depend;

export const untrackAll = <Args extends any[]>(...args: Args) =>
  args.map((x) => untrack(x)) as UnRefArray<Args>;

export const useDisposer = () => {
  let unmounted = false;
  let callbacks = [] as any[];
  onUnmount(() => {
    unmounted = true;
    callbacks.forEach((cb) => cb());
    callbacks = [];
  });
  function disposeCallback(fn: (...args: any[]) => any) {
    if (unmounted) {
      fn();
      return;
    }
    callbacks.push(fn);
  }
  return disposeCallback;
};
