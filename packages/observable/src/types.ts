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

  map<U>(fn: (value: T) => U): Observable<U>;
  filter(fn: (value: T) => boolean): Observable<T>;

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

  window(count: number): Observable<Observable<T>>;

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
