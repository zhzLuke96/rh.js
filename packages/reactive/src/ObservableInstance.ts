import {
  DeepReadonly,
  Ref,
  UnwrapRef,
  untrack,
  isRef,
  unref,
} from "@rhjs/core";
import { ExtensibleFunction } from "./ExtensibleFunction";
import { Observable, IS_OBSERVABLE, NONE } from "./types";
import {
  StateMutator,
  StateOptions,
  createEffect,
  createState,
} from "@rhjs/hooks";

const is_observer = (value: any): value is Observable<any> =>
  typeof value === "function" && value[IS_OBSERVABLE];
const is_promise_like = (value: any): value is PromiseLike<any> =>
  typeof value === "object" && typeof value.then === "function";

const is_iterable = (obj: any): obj is Iterator<unknown> & Iterable<any> =>
  obj != null &&
  (typeof obj[Symbol.iterator] === "function" ||
    typeof obj[Symbol.asyncIterator] === "function");

// 这里有类型问题...ts没法实现callable的类型，所以没法implements...
// 并且很多返回都需要写成as any...
// implements IObservable<T>
export class ObservableImpl<T> extends ExtensibleFunction {
  static of<T extends PromiseLike<any>>(value: T): Observable<Awaited<T>>;
  static of<T extends Iterator<any>>(
    value: T
  ): Observable<T extends Iterator<infer P> ? Awaited<P> : never>;
  static of<T extends AsyncIterator<any>>(
    value: T
  ): Observable<T extends AsyncIterator<infer P> ? Awaited<P> : never>;
  static of<T extends Array<any>>(value: T): Observable<T[number]>;
  static of<T extends Set<any>>(
    value: T
  ): Observable<T extends Set<infer P> ? P : never>;
  static of<T extends Ref<any>>(
    value: T
  ): Observable<T extends Ref<infer P> ? P : never>;
  static of<T>(value: T): Observable<T>;
  static of<T>(value?: T): Observable<T>;
  static of<T>(value?: T): Observable<any> {
    if (is_observer(value)) {
      return value;
    }
    if (is_promise_like(value)) {
      const observable = new ObservableImpl(null);
      value.then((value) => observable.complete(value));
      if ("catch" in value && typeof value.catch === "function") {
        value.catch((error: any) => observable.complete(error));
      }
      return observable as any as Observable<T>;
    }
    if (is_iterable(value)) {
      const observable = new ObservableImpl(value.next().value);
      (async () => {
        for await (const item of value) {
          observable.next(item);
        }
        observable.complete();
      })();
      return observable as any as Observable<T>;
    }
    if (isRef(value)) {
      const observable = new ObservableImpl(value.value);
      createEffect(() => {
        observable.next(unref(value));
      });
      return observable as any as Observable<T>;
    }
    if (Array.isArray(value)) {
      const observable = new ObservableImpl(value[0]);
      value.forEach((value) => observable.next(value));
      observable.complete();
      return observable as any as Observable<T>;
    }
    if (value instanceof Set) {
      const observable = new ObservableImpl(value.values().next().value);
      value.forEach((value) => observable.next(value));
      observable.complete();
      return observable as any as Observable<T>;
    }
    return new ObservableImpl(value) as any;
  }

  static fromEvent<K extends keyof HTMLElementEventMap>(
    target: Element,
    type: K
  ): Observable<HTMLElementEventMap[K]>;
  static fromEvent<K extends keyof HTMLElementEventMap, T>(
    target: Element,
    type: K,
    selector: (event: HTMLElementEventMap[K]) => T
  ): Observable<T>;
  static fromEvent<K extends keyof HTMLElementEventMap, T>(
    target: Element,
    type: K,
    selector?: (event: HTMLElementEventMap[K]) => T
  ): Observable<T>;
  static fromEvent<K extends keyof HTMLElementEventMap, T>(
    target: Element,
    type: K,
    selector?: (event: HTMLElementEventMap[K]) => T
  ): Observable<any> {
    const observable = new ObservableImpl<T | any>(null);
    target.addEventListener(type, (event) => {
      observable.next(
        selector ? selector(event as any) : (event as unknown as T)
      );
    });
    return observable as any;
  }

  [IS_OBSERVABLE] = true as const;
  __v_isRef = true;

  _state: Readonly<Ref<DeepReadonly<UnwrapRef<T>>>>;
  _setter: StateMutator<T>;

  listeners: Set<(value: T) => void> = new Set();
  listeners_times: WeakMap<(value: T) => void, number> = new WeakMap();

  completed = false;

  constructor(
    readonly initialState: T = NONE as T,
    readonly options?: StateOptions<T>
  ) {
    const [data, setter] = createState(undefined as any, options);
    super((value: any = NONE) => {
      if (value === NONE) {
        return data.value;
      }
      if (this.completed) {
        return value;
      }
      const compare = options?.equals || Object.is;
      const changed = !compare(untrack(data) as any, value);
      if (changed) {
        this.next(value);
      }
      return value;
    });
    this._state = data;
    this._setter = setter;

    if (initialState !== NONE) {
      this.next(initialState);
    }
  }

  get value(): T {
    return this._state.value as T;
  }
  set value(value: T) {
    if (this.completed) {
      return;
    }
    this.next(value);
  }

  next(value: T): void {
    this._setter(() => value);

    this.listeners.forEach((listener) => {
      listener(value);
      const times = this.listeners_times.get(listener) || 0;
      const times_left = times - 1;
      if (times_left > 0) {
        this.listeners_times.set(listener, times_left);
      } else {
        this.listeners.delete(listener);
        this.listeners_times.delete(listener);
      }
    });
  }

  complete(value: T = NONE as T): void {
    if (this.completed) {
      return;
    }
    this.completed = true;
    if (value !== NONE) {
      this.next(value);
    } else {
      this.next(this.value);
    }
    this.listeners.clear();
  }

  finally(listener: (value: T) => void): () => void {
    const handler = (value: T) => {
      if (this.completed) {
        listener(value);
        this.listeners.delete(handler);
      }
    };
    this.subscribe(handler);
    return () => this.listeners.delete(handler);
  }

  subscribe(listener: (value: T) => void, times = Infinity): () => void {
    this.listeners.add(listener);
    this.listeners_times.set(listener, times);
    return () => this.listeners.delete(listener);
  }

  scan<U>(
    fn: (acc: U | undefined, value: T, index: number) => U
  ): Observable<U>;
  scan<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): Observable<U>;
  scan(fn: Function, initial?: unknown): Observable<any> {
    const observable = new ObservableImpl(initial);
    let acc = typeof initial === "undefined" ? this.value : initial;
    let index = 0;
    this.subscribe((value) => {
      acc = fn(acc, value, index);
      index++;
      observable.next(acc);
    });
    this.finally((value) => observable.complete(fn(acc, value, index)));
    return observable as any;
  }
  reduce<U>(
    fn: (acc: U | undefined, value: T, index: number) => U
  ): Observable<U>;
  reduce<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): Observable<U>;
  reduce(fn: Function, initial?: unknown): Observable<any> {
    return this.scan(fn as any, initial).last();
  }

  take(count: number): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let taken = 0;
    this.subscribe((value) => {
      if (taken < count) {
        taken++;
        observable.next(value);
      } else {
        observable.complete(value);
      }
    });
    return observable as any;
  }
  first(): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.subscribe((value) => observable.complete(value));
    return observable as any;
  }
  last(): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.finally((value) => observable.complete(value));
    return observable as any;
  }

  map<U>(fn: (value: T) => U): Observable<U | undefined>;
  map<U>(fn: (value: T) => U, initial: U): Observable<U>;
  map<U>(fn: (value: T) => U, initial?: U): Observable<U | undefined>;
  map<U>(fn: (value: T) => U, initial?: U): Observable<U | undefined> {
    return this.scan((_, value) => fn(value), initial);
  }

  zip(...others: Observable<any>[]): Observable<any[]> {
    const observables = [this, ...others];
    const observable = new ObservableImpl(
      observables.map((observable) => observable.value)
    );
    observables.forEach((observable, index) =>
      observable.subscribe((value) => {
        const values = observable.value;
        values[index] = value;
        observable.next(values);
      })
    );
    let completed = 0;
    observables.forEach((observable) =>
      observable.finally(() => {
        completed++;
        if (completed >= observables.length) {
          observable.complete();
        }
      })
    );
    return observable as any;
  }

  buffer(other: Observable<any>): Observable<T[]> {
    const observable = new ObservableImpl<T[]>([]);
    let buffer: T[] = [];
    other.subscribe(() => {
      observable.next(buffer);
      buffer = [];
    });
    this.subscribe((value) => buffer.push(value));
    this.finally(() => observable.complete(buffer));
    return observable as any;
  }

  bufferCount(n: number): Observable<T[]> {
    const counter$ = this.scan((acc) => (acc + 1) % n, 0).filter(
      (value) => value === 0
    );
    return this.buffer(counter$);
  }

  filter(fn: (value: T) => boolean): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.subscribe((value) => {
      if (fn(value)) {
        observable.next(value);
      }
    });
    this.finally((value) => observable.complete(value));
    return observable as any;
  }

  toArray(): Observable<T[]> {
    return this.reduce((acc: T[], value: T) => [...acc, value], []);
  }

  window(other: Observable<any>): Observable<Observable<T>> {
    const observable = new ObservableImpl(new ObservableImpl(this.value));
    let window = observable.value;
    other.subscribe(() => {
      window.complete();
      window = new ObservableImpl(this.value);
      observable.next(window);
    });
    this.subscribe((value) => window.next(value));
    this.finally(() => observable.complete());
    return observable as any;
  }

  windowCount(count: number): Observable<Observable<T>> {
    const counter$ = this.scan((acc) => (acc + 1) % count, 0).filter(
      (value) => value === 0
    );
    return this.window(counter$);
  }

  timeInterval(): Observable<{ value: T; interval: number }> {
    const observable = new ObservableImpl({
      value: this.value,
      interval: 0,
    });
    let last = Date.now();
    this.subscribe((value) => {
      const now = Date.now();
      observable.next({ value, interval: now - last });
      last = now;
    });
    this.finally(() => observable.complete());
    return observable as any;
  }

  timeout(ms: number): Observable<T | Error> {
    const observable = new ObservableImpl<T | Error>(this.value);
    this.subscribe((value) => observable.complete(value));
    setTimeout(() => observable.complete(new Error("timeout")), ms);
    return observable as any;
  }

  audit(other: Observable<any>): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let timeout: any;
    other.subscribe(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => observable.next(this.value));
    });
    this.finally(() => observable.complete());
    return observable as any;
  }

  combine<U, V>(
    other: Observable<U>,
    fn: (value: T, other: U) => V
  ): Observable<V> {
    const observable = new ObservableImpl(fn(this.value, other.value));
    this.subscribe((value) => (observable.value = fn(value, other.value)));
    other.subscribe((value) => (observable.value = fn(this.value, value)));
    return observable as any;
  }

  mergeInternal<U extends T>(
    _others: Observable<U> | Observable<U>[],
    concurrent = Infinity
  ) {
    const observables: Array<Observable<U>> = Array.isArray(_others)
      ? [this as any, ..._others]
      : [this as any, _others];
    const buffer = new Set(observables.slice(0, concurrent));
    let index = concurrent;

    const observable = new ObservableImpl(this.value as U);
    buffer.forEach((o) => o.subscribe((value) => observable.next(value)));

    observables.forEach((o) =>
      o.finally(() => {
        buffer.delete(o);

        if (buffer.size === 0) {
          observable.complete();
        }
        if (buffer.size >= concurrent) {
          return;
        }
        if (index < observables.length) {
          const next = observables[index++];
          buffer.add(next);
          observable.next(next.value);
          next.subscribe((value) => observable.next(value));
        }
      })
    );

    return {
      observable,
      add(other: Observable<U>) {
        observables.push(other);
      },
    };
  }
  merge<U extends T>(
    _others: Observable<U> | Observable<U>[],
    concurrent = Infinity
  ): Observable<U> {
    return this.mergeInternal(_others, concurrent).observable as any;
  }
  mergeAll<U extends T>(
    _others: Observable<U> | Observable<U>[],
    concurrent = Infinity
  ): Observable<U> {
    return this.mergeInternal(_others, concurrent).observable as any;
  }
  mergeMap<U extends T>(
    fn: (value: T) => Observable<U>,
    concurrent = Infinity
  ): Observable<U> {
    const { observable, add } = this.mergeInternal<U>([], concurrent);
    this.subscribe((value) => add(fn(value)));
    return observable as any;
  }

  concat<U extends T>(others: Observable<U> | Observable<U>[]): Observable<U> {
    return this.merge(others, 1);
  }
  concatAll<U extends T>(
    others: Observable<U> | Observable<U>[]
  ): Observable<U> {
    return this.mergeAll(others, 1);
  }
  concatMap<U extends T>(fn: (value: T) => Observable<U>): Observable<U> {
    return this.mergeMap(fn, 1);
  }

  debounce(ms: number): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let timeout: any;
    this.subscribe((value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => observable.next(value), ms);
    });
    return observable as any;
  }
  throttle(ms: number): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let timeout: any;
    this.subscribe((value) => {
      if (!timeout) {
        timeout = setTimeout(() => {
          observable.next(value);
          timeout = undefined;
        }, ms);
      }
    });
    return observable as any;
  }
  distinct(): Observable<T> {
    const observable = new ObservableImpl(this.value);
    const values = new Set([this.value]);
    this.subscribe((value) => {
      if (!values.has(value)) {
        values.add(value);
        observable.next(value);
      }
    });
    return observable as any;
  }
  distinctUntilChanged(): Observable<T>;
  distinctUntilChanged<U>(fn: (value: T) => U): Observable<T>;
  distinctUntilChanged(fn?: unknown): Observable<T> {
    const observable = new ObservableImpl(this.value);
    const values = new Set([this.value]);
    this.subscribe((value) => {
      const key = typeof fn === "function" ? fn(value) : value;
      if (!values.has(key)) {
        values.add(key);
        observable.next(value);
      }
    });
    return observable as any;
  }
  skip(count: number): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let skipped = 0;
    this.subscribe((value) => {
      if (skipped < count) {
        skipped++;
      } else {
        observable.next(value);
      }
    });
    return observable as any;
  }
  skipWhile(fn: (value: T) => boolean): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let skipped = false;
    this.subscribe((value) => {
      if (!skipped && fn(value)) {
        skipped = true;
      }
      if (skipped) {
        observable.next(value);
      }
    });
    return observable as any;
  }
  skipUntil(other: Observable<any>): Observable<T> {
    const observable = new ObservableImpl(this.value);
    let skipped = false;
    other.subscribe(() => (skipped = true));
    this.subscribe((value) => {
      if (skipped) {
        observable.next(value);
      }
    });
    return observable as any;
  }
  takeWhile(fn: (value: T) => boolean): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.subscribe((value) => {
      if (fn(value)) {
        observable.next(value);
      }
    });
    return observable as any;
  }
  takeUntil(other: Observable<any>): Observable<T> {
    const observable = new ObservableImpl(this.value);
    other.subscribe(() => observable.complete());
    this.subscribe((value) => observable.next(value));
    return observable as any;
  }

  tap(fn: (value: T) => void): Observable<T> {
    this.subscribe(fn);
    return this as any;
  }
  withLatestFrom<U, V>(
    other: Observable<U>,
    fn: (value: T, other: U) => V
  ): Observable<V> {
    const observable = new ObservableImpl(fn(this.value, other.value));
    this.subscribe((value) => (observable.value = fn(value, other.value)));
    other.subscribe((value) => (observable.value = fn(this.value, value)));
    return observable as any;
  }
  startWith(value: T): Observable<T> {
    const observable = new ObservableImpl(value);
    this.subscribe((value) => observable.next(value));
    return observable as any;
  }
  endWith(value: T): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.subscribe((value) => observable.next(value));
    this.finally((value) => observable.complete(value));
    return observable as any;
  }
  defaultIfEmpty(value: T): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.subscribe((value) => observable.next(value));
    if (typeof this.value === "undefined") {
      observable.next(value);
    }
    return observable as any;
  }
  every(fn: (value: T) => boolean): Observable<boolean> {
    const values = new Set([this.value]);
    const observable = new ObservableImpl(fn(this.value));
    this.subscribe((value) => {
      values.add(value);
      observable.next([...values].every(fn));
    });
    return observable as any;
  }
  some(fn: (value: T) => boolean): Observable<boolean> {
    const values = new Set([this.value]);
    const observable = new ObservableImpl(fn(this.value));
    this.subscribe((value) => {
      values.add(value);
      observable.next([...values].some(fn));
    });
    return observable as any;
  }
  find(fn: (value: T) => boolean): Observable<T> {
    const observable = new ObservableImpl(this.value);
    this.subscribe((value) => {
      if (fn(value)) {
        observable.complete(value);
      }
    });
    return observable as any;
  }
  findIndex(fn: (value: T) => boolean): Observable<number> {
    const values = new Set([this.value]);
    const observable = new ObservableImpl([...values].findIndex(fn) as number);
    this.subscribe((value) => {
      values.add(value);
      if (fn(value)) {
        observable.complete([...values].findIndex(fn) as number);
      }
    });
    return observable as any;
  }
  min(): Observable<number> {
    return this.reduce(
      (acc: number, value: T) =>
        acc < (value as unknown as number) ? acc : (value as unknown as number),
      -Infinity
    );
  }
  max(): Observable<number> {
    return this.reduce(
      (acc: number, value: T) =>
        acc > (value as unknown as number) ? acc : (value as unknown as number),
      Infinity
    );
  }
  sum(): Observable<number> {
    return this.reduce(
      (acc: number, value: T) => acc + (value as unknown as number),
      0
    );
  }

  average(): Observable<number> {
    return this.reduce(
      (acc: { sum: number; length: number }, value: T) => ({
        sum: acc.sum + (value as unknown as number),
        length: acc.length + 1,
      }),
      { sum: 0, length: 0 }
    ).map(({ sum, length }) => sum / length, 0);
  }
  count(): Observable<number> {
    return this.reduce((acc: number, value: T) => acc + 1, 0);
  }

  switchMap<U extends T>(fn: (value: T) => Observable<U>): Observable<U> {
    const observable = new ObservableImpl<U>(this.value as U);
    let subscription: (() => void) | undefined;
    this.subscribe((value) => {
      if (subscription) {
        subscription();
      }
      subscription = fn(value).subscribe((value) => observable.next(value));
    });
    return observable as any;
  }
  switchAll(): Observable<T> {
    return this.switchMap((value) => ObservableImpl.of(value));
  }
}
