export const NONE = Symbol();
export const IS_OBSERVABLE = Symbol();

export interface IObservable<T> {
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
  ): IObservable<U>;
  scan<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): IObservable<U>;

  reduce<U>(
    fn: (acc: U | undefined, value: T, index: number) => U
  ): IObservable<U>;
  reduce<U>(
    fn: (acc: U, value: T, index: number) => U,
    initial: U
  ): IObservable<U>;

  map<U>(fn: (value: T) => U): IObservable<U>;
  filter(fn: (value: T) => boolean): IObservable<T>;

  combine<U, V>(
    other: IObservable<U>,
    fn: (value: T, other: U) => V
  ): IObservable<V>;

  debounce(ms: number): IObservable<T>;
  throttle(ms: number): IObservable<T>;

  distinct(): IObservable<T>;

  distinctUntilChanged(): IObservable<T>;
  distinctUntilChanged<U>(fn: (value: T) => U): IObservable<T>;

  skip(count: number): IObservable<T>;
  skipWhile(fn: (value: T) => boolean): IObservable<T>;
  skipUntil(other: IObservable<any>): IObservable<T>;

  take(count: number): IObservable<T>;
  takeWhile(fn: (value: T) => boolean): IObservable<T>;
  takeUntil(other: IObservable<any>): IObservable<T>;

  tap(fn: (value: T) => void): IObservable<T>;
  withLatestFrom<U, V>(
    other: IObservable<U>,
    fn: (value: T, other: U) => V
  ): IObservable<V>;

  startWith(value: T): IObservable<T>;
  endWith(value: T): IObservable<T>;

  defaultIfEmpty(value: T): IObservable<T>;

  every(fn: (value: T) => boolean): IObservable<boolean>;
  some(fn: (value: T) => boolean): IObservable<boolean>;
  find(fn: (value: T) => boolean): IObservable<T>;
  findIndex(fn: (value: T) => boolean): IObservable<number>;
  first(): IObservable<T>;
  last(): IObservable<T>;

  audit(other: IObservable<any>): IObservable<T>;

  min(): IObservable<number>;
  max(): IObservable<number>;
  sum(): IObservable<number>;
  average(): IObservable<number>;
  count(): IObservable<number>;

  toArray(): IObservable<T[]>;

  window(count: number): IObservable<IObservable<T>>;

  merge<U extends T>(
    others: IObservable<U> | IObservable<U>[],
    concurrent?: number
  ): IObservable<U>;
  mergeAll<U extends T>(
    others: IObservable<U> | IObservable<U>[],
    concurrent?: number
  ): IObservable<U>;
  mergeMap<U extends T>(
    fn: (value: T) => IObservable<U>,
    concurrent?: number
  ): IObservable<U>;

  concat<U extends T>(
    others: IObservable<U> | IObservable<U>[]
  ): IObservable<U>;
  concatAll<U extends T>(
    others: IObservable<U> | IObservable<U>[]
  ): IObservable<U>;
  concatMap<U extends T>(fn: (value: T) => IObservable<U>): IObservable<U>;

  switchMap<U extends T>(fn: (value: T) => IObservable<U>): IObservable<U>;
  switchAll(): IObservable<T>;
}
