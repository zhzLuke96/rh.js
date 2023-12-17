export const NONE = Symbol();
export const IS_OBSERVABLE = Symbol();

export interface Observable<T> {
  (): T;
  (value: T): T;

  value: T;
  [IS_OBSERVABLE]: boolean;
  next(value: T): void;
  complete(value?: T): void;

  subscribe(listener: (value: T) => void, times?: number): () => void;
  finally(listener: (value: T) => void): () => void;

  scan<U>(
    fn: (acc: U | undefined, value: T, index: number) => U
  ): Observable<U>;
  scan<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): Observable<U>;

  reduce<U>(
    fn: (acc: U | undefined, value: T, index: number) => U
  ): Observable<U>;
  reduce<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): Observable<U>;

  map<U>(fn: (value: T) => U): Observable<U | undefined>;
  map<U>(fn: (value: T) => U, initial: U): Observable<U>;
  map<U>(fn: (value: T) => U, initial?: U): Observable<U | undefined>;

  filter(fn: (value: T) => boolean): Observable<T>;

  zip<U>(other: Observable<U>): Observable<[T, U]>;
  zip<U, V>(
    other1: Observable<U>,
    other2: Observable<V>
  ): Observable<[T, U, V]>;
  zip<U, V, W>(
    other1: Observable<U>,
    other2: Observable<V>,
    other3: Observable<W>
  ): Observable<[T, U, V, W]>;
  zip<U, V, W, X>(
    other1: Observable<U>,
    other2: Observable<V>,
    other3: Observable<W>,
    other4: Observable<X>
  ): Observable<[T, U, V, W, X]>;
  zip<U, V, W, X, Y>(
    other1: Observable<U>,
    other2: Observable<V>,
    other3: Observable<W>,
    other4: Observable<X>,
    other5: Observable<Y>
  ): Observable<[T, U, V, W, X, Y]>;
  zip(...others: Observable<any>[]): Observable<any[]>;

  buffer(other: Observable<any>): Observable<T[]>;

  bufferCount(n: 1): Observable<[T]>;
  bufferCount(n: 2): Observable<[T, T]>;
  bufferCount(n: 3): Observable<[T, T, T]>;
  bufferCount(n: 4): Observable<[T, T, T, T]>;
  bufferCount(n: 5): Observable<[T, T, T, T, T]>;
  bufferCount(n: number): Observable<T[]>;

  combine<U, V>(
    other: Observable<U>,
    fn: (value: T, other: U) => V
  ): Observable<V>;

  debounce(ms: number): Observable<T>;
  throttle(ms: number): Observable<T>;

  distinct(): Observable<T>;

  distinctUntilChanged(): Observable<T>;
  distinctUntilChanged<U>(fn: (value: T) => U): Observable<T>;

  skip(count: number): Observable<T>;
  skipWhile(fn: (value: T) => boolean): Observable<T>;
  skipUntil(other: Observable<any>): Observable<T>;

  take(count: number): Observable<T>;
  takeWhile(fn: (value: T) => boolean): Observable<T>;
  takeUntil(other: Observable<any>): Observable<T>;

  tap(fn: (value: T) => void): Observable<T>;
  withLatestFrom<U, V>(
    other: Observable<U>,
    fn: (value: T, other: U) => V
  ): Observable<V>;

  startWith(value: T): Observable<T>;
  endWith(value: T): Observable<T>;

  defaultIfEmpty(value: T): Observable<T>;

  every(fn: (value: T) => boolean): Observable<boolean>;
  some(fn: (value: T) => boolean): Observable<boolean>;
  find(fn: (value: T) => boolean): Observable<T>;
  findIndex(fn: (value: T) => boolean): Observable<number>;
  first(): Observable<T>;
  last(): Observable<T>;

  audit(other: Observable<any>): Observable<T>;

  min(): Observable<number>;
  max(): Observable<number>;
  sum(): Observable<number>;
  average(): Observable<number>;
  count(): Observable<number>;

  toArray(): Observable<T[]>;

  window(other: Observable<any>): Observable<Observable<T>>;
  windowCount(count: number): Observable<Observable<T>>;

  timeInterval(): Observable<{
    value: T;
    interval: number;
  }>;

  timeout(ms: number): Observable<T | Error>;

  merge<U extends T>(
    others: Observable<U> | Observable<U>[],
    concurrent?: number
  ): Observable<U>;
  mergeAll<U extends T>(
    others: Observable<U> | Observable<U>[],
    concurrent?: number
  ): Observable<U>;
  mergeMap<U extends T>(
    fn: (value: T) => Observable<U>,
    concurrent?: number
  ): Observable<U>;

  concat<U extends T>(others: Observable<U> | Observable<U>[]): Observable<U>;
  concatAll<U extends T>(
    others: Observable<U> | Observable<U>[]
  ): Observable<U>;
  concatMap<U extends T>(fn: (value: T) => Observable<U>): Observable<U>;

  switchMap<U extends T>(fn: (value: T) => Observable<U>): Observable<U>;
  switchAll(): Observable<T>;
}
