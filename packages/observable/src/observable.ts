class ExtensibleFunction extends Function {
  // @ts-ignore
  constructor(f: Function) {
    return Object.setPrototypeOf(f, new.target.prototype);
  }
}
class IdGenerator {
  private index = 0;
  constructor(private prefix = "") {}
  next() {
    return `${this.prefix}${this.index++}`;
  }
}

const unique = <T>(array: T[]) => Array.from(new Set(array));

const NONE = Symbol("NONE");

export class ObservableCollector {
  static tracking = true;
  static trackingStack = [] as boolean[];
  static dependenciesStack: Set<any>[] = [];

  static pauseTracking() {
    this.trackingStack.push(this.tracking);
    this.tracking = false;
  }
  static enableTracking() {
    this.trackingStack.push(this.tracking);
    this.tracking = true;
  }
  static resetTracking() {
    this.tracking = this.trackingStack.length
      ? this.trackingStack.pop()!
      : true;
  }

  static triggerTracking = false;
  static triggerTrackingStack = [] as boolean[];
  static pauseTriggerTracking() {
    this.triggerTrackingStack.push(this.triggerTracking);
    this.triggerTracking = false;
  }
  static enableTriggerTracking() {
    this.triggerTrackingStack.push(this.triggerTracking);
    this.triggerTracking = true;
  }
  static resetTriggerTracking() {
    this.triggerTracking = this.triggerTrackingStack.length
      ? this.triggerTrackingStack.pop()!
      : true;
  }

  static track(dep: any): void {
    if (
      dep === null ||
      (typeof dep !== "object" && typeof dep !== "function")
    ) {
      return;
    }
    if (!this.tracking) {
      return;
    }
    this.dependenciesStack.forEach((dependencies) => dependencies.add(dep));
  }

  static collect<T>(fn: () => T) {
    this.enableTracking();
    const dependencies = new Set<any>();
    this.dependenciesStack.push(dependencies);
    try {
      return {
        value: fn(),
        dependencies: Array.from(dependencies),
      };
    } finally {
      this.resetTracking();
      this.dependenciesStack.pop();
    }
  }

  static collectTrigger<T>(fn: () => T) {
    this.enableTriggerTracking();
    const dependencies = new Set<any>();
    this.dependenciesStack.push(dependencies);
    try {
      return {
        value: fn(),
        dependencies: Array.from(dependencies),
      };
    } finally {
      this.resetTriggerTracking();
      this.dependenciesStack.pop();
    }
  }

  static batch<T>(fn: () => T, excludes = [] as ObservableEffect[]) {
    const { value, dependencies } = ObservableCollector.collectTrigger(fn);

    const observables = unique(
      dependencies.filter((x) => x instanceof Observable)
    ) as Observable<any>[];
    const effects = unique(
      observables
        .map((observable) => ObservableEffect.getEffects(observable))
        .flat()
    ) as ObservableEffect[];

    // disable all effects
    effects.forEach((effect) => effect.disable());
    try {
      // trigger all observables
      observables.forEach((observable) => observable.trigger());
    } finally {
      // enable all effects
      effects.forEach((effect) => effect.enable());
      // run all effect, except the ones that are excluded
      effects
        .filter((effect) => !excludes.includes(effect))
        .forEach((effect) => effect.run());
    }

    return value;
  }

  static collectBatch<T>(fn: () => T, excludes = [] as ObservableEffect[]) {
    return ObservableCollector.collect(() =>
      ObservableCollector.batch(fn, excludes)
    );
  }
}

export interface ObservableEffectOptions {
  onTrack?: (event: {
    current: ObservableEffect | undefined;
    dependencies: any[];
  }) => void;
  onTrigger?: (event: {
    current: ObservableEffect | undefined;
    observable: Observable<any>;
  }) => void;
  onStop?: (event: { current: ObservableEffect | undefined }) => void;
}

export class ObservableEffect {
  static ids = new IdGenerator("eff-");
  static all = new Set<ObservableEffect>();
  static getEffects(observable: Observable<any>) {
    return Array.from(this.all).filter((effect) =>
      effect.dependencies.has(observable)
    );
  }

  // active effect stack
  static active_effects = [] as ObservableEffect[];
  static current() {
    return this.active_effects[this.active_effects.length - 1] as
      | ObservableEffect
      | undefined;
  }

  readonly __id = ObservableEffect.ids.next();

  private unsubcribes = new Set<() => void>();
  private dependencies = new Set<Observable<any>>();

  onTrack: ObservableEffectOptions["onTrack"] = () => {};
  onTrigger: ObservableEffectOptions["onTrigger"] = () => {};
  onStop: ObservableEffectOptions["onStop"] = () => {};

  enabled = true;

  constructor(
    readonly fn: () => any,
    readonly options?: ObservableEffectOptions
  ) {
    ObservableEffect.all.add(this);
    ObservableCollector.track(this);
    this.onTrack = options?.onTrack || this.onTrack;
    this.onTrigger = options?.onTrigger || this.onTrigger;
    this.onStop = options?.onStop || this.onStop;
  }

  get deps() {
    return Array.from(this.dependencies);
  }

  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }

  run() {
    const loop = ObservableEffect.active_effects.includes(this);
    if (loop) {
      console.warn(`effect loop detected: ${this.__id}`);
      return;
    }
    ObservableEffect.active_effects.push(this);

    try {
      const { dependencies } = ObservableCollector.collectBatch(this.fn, [
        this,
      ]);
      this.onTrack?.({
        current: ObservableEffect.current(),
        dependencies: Array.from(dependencies),
      });

      const new_dependencies = dependencies.filter(
        (x) => x instanceof Observable && !this.dependencies.has(x)
      ) as Observable<any>[];
      new_dependencies.forEach((observable) => this.addDependency(observable));
    } finally {
      ObservableEffect.active_effects.pop();
    }
  }

  stop() {
    this.onStop?.({
      current: ObservableEffect.current(),
    });

    this.unsubcribes.forEach((unsubcribe) => unsubcribe());
    this.dependencies.clear();
    this.unsubcribes.clear();
    ObservableEffect.all.delete(this);
  }

  addDependency(observable: Observable<any>) {
    if (this.dependencies.has(observable)) {
      return;
    }
    const unsubcribe = observable.subscribe(() => {
      if (this.enabled === false) return;
      this.fn();
      this.onTrigger?.({
        current: ObservableEffect.current(),
        observable,
      });
    });
    this.unsubcribes.add(unsubcribe);
    this.dependencies.add(observable);
  }
}

export class ObservableEffectScope {
  static ids = new IdGenerator("es-");
  static active: ObservableEffectScope | undefined;

  private effects = new Set<ObservableEffect>();
  private parent = ObservableEffectScope.active;
  private children = new Set<ObservableEffectScope>();

  readonly __id = ObservableEffectScope.ids.next();

  constructor() {
    this.parent?.children.add(this);
  }

  add(effect: ObservableEffect) {
    this.effects.add(effect);
  }

  stop() {
    this.effects.forEach((effect) => effect.stop());
    this.effects.clear();
    this.parent?.children.delete(this);
    this.children.forEach((child) => child.stop());
  }

  run<T>(fn: () => T) {
    const currentScope = ObservableEffectScope.active;
    ObservableEffectScope.active = this;
    try {
      const { value, dependencies } = ObservableCollector.collect(fn);
      dependencies
        .filter((x) => x instanceof ObservableEffect)
        .forEach((effect) => this.effects.add(effect));
      return value;
    } finally {
      ObservableEffectScope.active = currentScope;
    }
  }
}

export type ListenerOptions = {
  times?: number;
};

export class Observable<T> extends ExtensibleFunction {
  static ids = new IdGenerator("obs-");

  readonly __id = Observable.ids.next();

  private listeners: Set<(value: T) => void> = new Set();
  private listeners_options: WeakMap<(value: T) => void, ListenerOptions> =
    new WeakMap();

  protected _completed = false;
  protected _value: T = NONE as T;

  constructor(
    initial?: T,
    readonly options?: { equals?: (a: T, b: T) => boolean }
  ) {
    super((newValue: T = NONE as T) => {
      if (newValue === NONE) {
        return this.value;
      }
      if (this._completed) {
        return newValue;
      }
      const compare = options?.equals || Object.is;
      const changed = !compare(this._value as any, newValue);
      if (changed) {
        this.next(newValue);
      }
      return newValue;
    });

    if (initial !== NONE) {
      this._value = initial as T;
    }
  }

  public get value(): T {
    ObservableCollector.track(this);
    return this._value as T;
  }
  public set value(value: T) {
    this.next(value);
  }

  next(value: T) {
    this._value = value;
    this.trigger();
  }

  listListeners() {
    return Array.from(this.listeners).map((listener) => ({
      listener,
      options: this.listeners_options.get(listener),
    }));
  }

  trigger() {
    if (this._value === NONE) {
      return;
    }
    if (ObservableCollector.triggerTracking) {
      ObservableCollector.track(this);
      return;
    }
    this.listeners.forEach((listener) => {
      listener(this._value!);

      const options = this.listeners_options.get(listener) || {};
      const { times = Infinity } = options;
      if (times === Infinity) return;

      const times_left = times - 1;
      if (times_left > 0) {
        this.listeners_options.set(listener, {
          ...options,
          times: times_left,
        });
      } else {
        this.listeners.delete(listener);
        this.listeners_options.delete(listener);
      }
    });
  }

  complete(value: T = NONE as T): void {
    if (this._completed) {
      return;
    }
    this._completed = true;
    if (value !== NONE) {
      this.next(value);
    } else {
      this.next(this.value);
    }
    this.listeners.clear();
  }

  finally(listener: (value: T) => void, options?: ListenerOptions): () => void {
    const handler = (value: T) => {
      if (this._completed) {
        listener(value);
        this.listeners.delete(handler);
      }
    };
    this.subscribe(handler, options);
    return () => this.listeners.delete(handler);
  }

  subscribe(
    listener: (value: T) => void,
    options?: { times?: number }
  ): () => void {
    this.listeners.add(listener);
    this.listeners_options.set(listener, {
      times: Infinity,
      ...options,
    });
    return () => {
      this.listeners.delete(listener);
      this.listeners_options.delete(listener);
    };
  }

  isCompleted() {
    return this._completed;
  }
}

// just tag type
export type Trackable<T> = T & { __is_trackable: true };

const RAW = Symbol("RAW");
export const toRaw = (x: any) =>
  !x ? x : typeof x === "function" || typeof x === "object" ? x[RAW] || x : x;
export const trackable = <T extends Record<keyof any, any>>(
  obj: T,
  { deep, parent }: { deep?: boolean; parent?: Observable<any> } = {}
): Trackable<T> => {
  const propsObservables = {} as Record<string, Observable<any>>;
  const ensureObservable = (prop: string) => {
    if (!propsObservables[prop]) {
      const observable = new Observable(obj[prop as any] as any);
      propsObservables[prop] = observable;
      if (deep && parent) {
        observable.subscribe(() => parent?.trigger());
      }
    }
    return propsObservables[prop];
  };
  const trackProp = (prop: string) => {
    const maybeObservable = ensureObservable(prop);
    if (maybeObservable instanceof Observable) {
      propsObservables[prop] = maybeObservable;
      ObservableCollector.track(maybeObservable);
    }
  };
  const triggerProp = (prop: string, next: any) => {
    const maybeObservable = ensureObservable(prop);
    if (maybeObservable instanceof Observable) {
      maybeObservable.next(next);
      if (deep) {
        parent?.trigger();
      }
    }
  };
  return new Proxy(obj as Trackable<T>, {
    get(target, prop, receiver) {
      if (prop === RAW) {
        return obj;
      }
      if (prop === "__is_trackable") {
        return true;
      }
      const value = Reflect.get(target, prop, receiver);
      trackProp(prop as string);
      if (typeof value === "object" && value !== null) {
        return trackable(value, {
          deep,
          parent: propsObservables[prop as any],
        });
      }
      return value;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      triggerProp(prop as string, value);
      return result;
    },
  });
};

interface CallableObservable<T> {
  (): T;
  (value: T): T;
}
export type TObservable<T> = Observable<T> & CallableObservable<T>;
export type ObservableLike<T> = TObservable<T> | { value: T };

export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

export type Ref<T> = Observable<T>;
export type RefLike<T> = { value: T } | Ref<T>;
export type MaybeRef<T> = T | RefLike<T>;
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T);
export type UnwrapRef<T> = T extends RefLike<infer U> ? U : T;

export const ref = <T>(initial?: T) =>
  new Observable(initial) as TObservable<T>;
export const unref = <T>(x: ObservableLike<T>) =>
  x instanceof Observable
    ? x()
    : x && typeof x === "object" && "value" in x
    ? x.value
    : x;
export const isRef = <T>(x: any): x is TObservable<T> =>
  x instanceof Observable;

export const effect = <T>(
  fn: () => T,
  options?: {
    lazy?: boolean;
  } & ObservableEffectOptions
): ObservableEffect => {
  const eff = new ObservableEffect(fn, options);
  if (!options?.lazy) eff.run();
  return eff;
};

export const effectScope = () => new ObservableEffectScope();

export const skip = <T, ARGS extends any[]>(
  fn: (...args: ARGS) => T,
  ...args: ARGS
) => {
  ObservableCollector.pauseTracking();
  try {
    return fn(...args);
  } finally {
    ObservableCollector.resetTracking();
  }
};
export const untrack = <T>(x: ObservableLike<T>) => skip(() => unref(x));
/**
 * just a type cast, no runtime logic
 */
export const readonly = <T>(x: T) => x as DeepReadonly<T>;
/**
 * batch update observables and effects
 *
 * make sure all effects run only once
 */
export const batch = <T>(fn: () => T, excludes = [] as ObservableEffect[]) =>
  ObservableCollector.batch(
    fn,
    [...excludes, ObservableEffect.active_effects].filter(
      Boolean
    ) as ObservableEffect[]
  );

export const triggerRef = <T>(ref: RefLike<T>) => {
  if (ref instanceof Observable) {
    ref.trigger();
  }
};

// ------------------------------
// example:
// const track1 = trackable(
//   {
//     data: 1,
//     list: [1, 2, 3] as any[],
//   },
//   {
//     deep: true,
//   }
// );

// const count1 = new Observable(1);
// const scope1 = new ObservableEffectScope();
// const scope2 = new ObservableEffectScope();

// scope1.run(() => {
//   effect(() => {
//     console.log("count1", count1());
//   });
//   effect(() => {
//     console.log("count", track1.data);
//   });
//   const eff = effect(() => {
//     console.log("count", track1.list);
//   });

//   scope2.run(() => {
//     effect(() => {
//       console.log("count1", count1());
//     });
//   });
// });

// count1(2);
// scope2.stop();
// count1(3);
// count1(4);

// track1.data = 2;
// track1.data = 3;

// ObservableCollector.batch(() => {
//   track1.list[1] = { x: 1 };
//   track1.list[1].x = 2;
//   // track1.list[1] = 3;
//   track1.list.pop();
//   // track1.list.pop();
// });
