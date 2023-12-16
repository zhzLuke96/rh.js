import { StateOptions, createWatcher } from "@rhjs/hooks";
import { Observable, IS_OBSERVABLE } from "./types";
import { ObservableImpl } from "./ObservableInstance";
import { Ref, ref } from "@rhjs/core";

export const observable = <T>(initialState: T, options?: StateOptions<T>) =>
  new ObservableImpl<T>(initialState, options);

export const isObservable = <T>(value: any): value is Observable<T> =>
  typeof value === "function" && value[IS_OBSERVABLE];

export const of = ObservableImpl.of;

export function createDomEventRef<K extends keyof HTMLElementEventMap, T>(
  type: K
): readonly [
  domRef: Ref<Element | undefined>,
  event$: Observable<HTMLElementEventMap[K]>
];
export function createDomEventRef<K extends keyof HTMLElementEventMap, T>(
  type: K,
  selector: (event: HTMLElementEventMap[K]) => T
): readonly [domRef: Ref<Element | undefined>, event$: Observable<T>];
export function createDomEventRef<K extends keyof HTMLElementEventMap, T>(
  type: K,
  selector?: (event: HTMLElementEventMap[K]) => T
): readonly [
  domRef: Ref<Element | undefined>,
  event$: Observable<HTMLElementEventMap[K]> | Observable<T>
] {
  const domRef = ref<Element>();
  const event$ = ObservableImpl.of<HTMLElementEventMap[K]>();
  let event2$: Observable<any> | undefined = undefined;
  createWatcher(domRef, (el) => {
    if (el) {
      if (event2$) event2$.complete();
      event2$ = ObservableImpl.fromEvent(el, type, selector);
      event2$.subscribe(event$);
    }
  });
  return [domRef, event$] as const;
}

// examples:
// const num1 = of(1);
// num1.subscribe((value) => console.log("num1", value));
// const num2 = num1.map((value) => value * 2);
// num2.subscribe((value) => console.log("num2", value));

// const num3 = num1.filter((value) => value % 2 === 0);
// num3.subscribe((value) => console.log("num3", value));
// num3.finally((value) => console.log("num3 finally", value));

// num1(2);
// num1(3);
// num1(4);
// num1(5);
// num1.complete();
