import { DeepReadonly, Ref, UnwrapRef, untrack } from "@rhjs/core";
import { ExtensibleFunction } from "./ExtensibleFunction";
import { IObservable, IS_OBSERVABLE, NONE } from "./types";
import { StateMutator, StateOptions, createState } from "@rhjs/hooks";

const is_observer = (value: any): value is IObservable<any> =>
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
export class Observable<T> extends ExtensibleFunction {
  static of<T extends PromiseLike<any>>(value: T): IObservable<Awaited<T>>;
  static of<T extends Iterator<any>>(
    value: T
  ): IObservable<T extends Iterator<infer P> ? Awaited<P> : never>;
  static of<T extends AsyncIterator<any>>(
    value: T
  ): IObservable<T extends AsyncIterator<infer P> ? Awaited<P> : never>;
  static of<T extends Array<any>>(value: T): IObservable<T[number]>;
  static of<T extends Set<any>>(
    value: T
  ): IObservable<T extends Set<infer P> ? P : never>;
  static of<T>(value: T): IObservable<T>;
  static of<T>(value: T): IObservable<any> {
    if (is_observer(value)) {
      return value;
    }
    if (is_promise_like(value)) {
      const observable = new Observable(null);
      value.then((value) => observable.complete(value));
      if ("catch" in value && typeof value.catch === "function") {
        value.catch((error: any) => observable.complete(error));
      }
      return observable as any as IObservable<T>;
    }
    if (is_iterable(value)) {
      const observable = new Observable(value.next().value);
      (async () => {
        for await (const item of value) {
          observable.next(item);
        }
        observable.complete();
      })();
      return observable as any as IObservable<T>;
    }
    if (Array.isArray(value)) {
      const observable = new Observable(value[0]);
      value.forEach((value) => observable.next(value));
      observable.complete();
      return observable as any as IObservable<T>;
    }
    if (value instanceof Set) {
      const observable = new Observable(value.values().next().value);
      value.forEach((value) => observable.next(value));
      observable.complete();
      return observable as any as IObservable<T>;
    }
    return new Observable(value) as any;
  }

  [IS_OBSERVABLE] = true as const;

  _state: Readonly<Ref<DeepReadonly<UnwrapRef<T>>>>;
  _setter: StateMutator<T>;

  listeners: Set<(value: T) => void> = new Set();
  listeners_times: WeakMap<(value: T) => void, number> = new WeakMap();

  completed = false;

  constructor(readonly initialState: T, readonly options?: StateOptions<T>) {
    const [data, setter] = createState(initialState, options);
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
  ): IObservable<U>;
  scan<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): IObservable<U>;
  scan(fn: Function, initial?: unknown): IObservable<any> {
    const observable = new Observable(
      typeof initial === "undefined" ? this.value : initial
    );
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
  ): IObservable<U>;
  reduce<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): IObservable<U>;
  reduce(fn: Function, initial?: unknown): IObservable<any> {
    return this.scan(fn as any, initial).last();
  }

  take(count: number): IObservable<T> {
    const observable = new Observable(this.value);
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
  first(): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => observable.complete(value));
    return observable as any;
  }
  last(): IObservable<T> {
    const observable = new Observable(this.value);
    this.finally((value) => observable.complete(value));
    return observable as any;
  }

  map<U>(fn: (value: T) => U): IObservable<U> {
    return this.scan((_, value) => fn(value));
  }

  filter(fn: (value: T) => boolean): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => {
      if (fn(value)) {
        observable.next(value);
      }
    });
    this.finally((value) => observable.complete(value));
    return observable as any;
  }

  toArray(): IObservable<T[]> {
    return this.reduce((acc: T[], value: T) => [...acc, value], []);
  }

  window(count: number): IObservable<IObservable<T>> {
    const observable = new Observable(new Observable(this.value));
    let window = observable.value;
    let index = 0;
    this.subscribe((value) => {
      if (index < count) {
        index++;
        window.next(value);
      } else {
        window.complete(value);
        window = new Observable(this.value);
        observable.next(window);
        index = 1;
      }
    });
    return observable as any;
  }

  audit(other: IObservable<any>): IObservable<T> {
    const observable = new Observable(this.value);
    let timeout: any;
    other.subscribe(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => observable.next(this.value));
    });
    this.finally(() => observable.complete());
    return observable as any;
  }

  combine<U, V>(
    other: IObservable<U>,
    fn: (value: T, other: U) => V
  ): IObservable<V> {
    const observable = new Observable(fn(this.value, other.value));
    this.subscribe((value) => (observable.value = fn(value, other.value)));
    other.subscribe((value) => (observable.value = fn(this.value, value)));
    return observable as any;
  }

  mergeInternal<U extends T>(
    _others: IObservable<U> | IObservable<U>[],
    concurrent = Infinity
  ) {
    const observables: Array<IObservable<U>> = Array.isArray(_others)
      ? [this as any, ..._others]
      : [this as any, _others];
    const buffer = new Set(observables.slice(0, concurrent));
    let index = concurrent;

    const observable = new Observable(this.value as U);
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
      add(other: IObservable<U>) {
        observables.push(other);
      },
    };
  }
  merge<U extends T>(
    _others: IObservable<U> | IObservable<U>[],
    concurrent = Infinity
  ): IObservable<U> {
    return this.mergeInternal(_others, concurrent).observable as any;
  }
  mergeAll<U extends T>(
    _others: IObservable<U> | IObservable<U>[],
    concurrent = Infinity
  ): IObservable<U> {
    return this.mergeInternal(_others, concurrent).observable as any;
  }
  mergeMap<U extends T>(
    fn: (value: T) => IObservable<U>,
    concurrent = Infinity
  ): IObservable<U> {
    const { observable, add } = this.mergeInternal<U>([], concurrent);
    this.subscribe((value) => add(fn(value)));
    return observable as any;
  }

  concat<U extends T>(
    others: IObservable<U> | IObservable<U>[]
  ): IObservable<U> {
    return this.merge(others, 1);
  }
  concatAll<U extends T>(
    others: IObservable<U> | IObservable<U>[]
  ): IObservable<U> {
    return this.mergeAll(others, 1);
  }
  concatMap<U extends T>(fn: (value: T) => IObservable<U>): IObservable<U> {
    return this.mergeMap(fn, 1);
  }

  debounce(ms: number): IObservable<T> {
    const observable = new Observable(this.value);
    let timeout: any;
    this.subscribe((value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => observable.next(value), ms);
    });
    return observable as any;
  }
  throttle(ms: number): IObservable<T> {
    const observable = new Observable(this.value);
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
  distinct(): IObservable<T> {
    const observable = new Observable(this.value);
    const values = new Set([this.value]);
    this.subscribe((value) => {
      if (!values.has(value)) {
        values.add(value);
        observable.next(value);
      }
    });
    return observable as any;
  }
  distinctUntilChanged(): IObservable<T>;
  distinctUntilChanged<U>(fn: (value: T) => U): IObservable<T>;
  distinctUntilChanged(fn?: unknown): IObservable<T> {
    const observable = new Observable(this.value);
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
  skip(count: number): IObservable<T> {
    const observable = new Observable(this.value);
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
  skipWhile(fn: (value: T) => boolean): IObservable<T> {
    const observable = new Observable(this.value);
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
  skipUntil(other: IObservable<any>): IObservable<T> {
    const observable = new Observable(this.value);
    let skipped = false;
    other.subscribe(() => (skipped = true));
    this.subscribe((value) => {
      if (skipped) {
        observable.next(value);
      }
    });
    return observable as any;
  }
  takeWhile(fn: (value: T) => boolean): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => {
      if (fn(value)) {
        observable.next(value);
      }
    });
    return observable as any;
  }
  takeUntil(other: IObservable<any>): IObservable<T> {
    const observable = new Observable(this.value);
    other.subscribe(() => observable.complete());
    this.subscribe((value) => observable.next(value));
    return observable as any;
  }

  tap(fn: (value: T) => void): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => {
      fn(value);
      observable.next(value);
    });
    return observable as any;
  }
  withLatestFrom<U, V>(
    other: IObservable<U>,
    fn: (value: T, other: U) => V
  ): IObservable<V> {
    const observable = new Observable(fn(this.value, other.value));
    this.subscribe((value) => (observable.value = fn(value, other.value)));
    other.subscribe((value) => (observable.value = fn(this.value, value)));
    return observable as any;
  }
  startWith(value: T): IObservable<T> {
    const observable = new Observable(value);
    this.subscribe((value) => observable.next(value));
    return observable as any;
  }
  endWith(value: T): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => observable.next(value));
    observable.next(value);
    return observable as any;
  }
  defaultIfEmpty(value: T): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => observable.next(value));
    if (typeof this.value === "undefined") {
      observable.next(value);
    }
    return observable as any;
  }
  every(fn: (value: T) => boolean): IObservable<boolean> {
    const values = new Set([this.value]);
    const observable = new Observable(fn(this.value));
    this.subscribe((value) => {
      values.add(value);
      observable.value = [...values].every(fn);
    });
    return observable as any;
  }
  some(fn: (value: T) => boolean): IObservable<boolean> {
    const values = new Set([this.value]);
    const observable = new Observable(fn(this.value));
    this.subscribe((value) => {
      values.add(value);
      observable.value = [...values].some(fn);
    });
    return observable as any;
  }
  find(fn: (value: T) => boolean): IObservable<T> {
    const observable = new Observable(this.value);
    this.subscribe((value) => {
      if (fn(value)) {
        observable.next(value);
      }
    });
    return observable as any;
  }
  findIndex(fn: (value: T) => boolean): IObservable<number> {
    const values = new Set([this.value]);
    const observable = new Observable([...values].findIndex(fn) as number);
    this.subscribe((value) => {
      values.add(value);
      observable.value = [...values].findIndex(fn) as number;
    });
    return observable as any;
  }
  min(): IObservable<number> {
    return this.reduce(
      (acc: number, value: T) =>
        acc < (value as unknown as number) ? acc : (value as unknown as number),
      -Infinity
    );
  }
  max(): IObservable<number> {
    return this.reduce(
      (acc: number, value: T) =>
        acc > (value as unknown as number) ? acc : (value as unknown as number),
      Infinity
    );
  }
  sum(): IObservable<number> {
    return this.reduce(
      (acc: number, value: T) => acc + (value as unknown as number),
      0
    );
  }

  average(): IObservable<number> {
    return this.reduce(
      (acc: { sum: number; length: number }, value: T) => ({
        sum: acc.sum + (value as unknown as number),
        length: acc.length + 1,
      }),
      { sum: 0, length: 0 }
    ).map(({ sum, length }) => sum / length);
  }
  count(): IObservable<number> {
    return this.reduce((acc: number, value: T) => acc + 1, 0);
  }

  switchMap<U extends T>(fn: (value: T) => IObservable<U>): IObservable<U> {
    const observable = new Observable<U>(this.value as U);
    let subscription: (() => void) | undefined;
    this.subscribe((value) => {
      if (subscription) {
        subscription();
      }
      subscription = fn(value).subscribe((value) => observable.next(value));
    });
    return observable as any;
  }
  switchAll(): IObservable<T> {
    return this.switchMap((value) => Observable.of(value));
  }
}
