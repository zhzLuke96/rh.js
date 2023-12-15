import { StateOptions } from "@rhjs/hooks";
import { IS_OBSERVABLE } from "./types";
import { Observable } from "./ObservableInstance";

export const observable = <T>(initialState: T, options?: StateOptions<T>) =>
  new Observable<T>(initialState, options);

export const isObservable = <T>(value: any): value is Observable<T> =>
  typeof value === "function" && value[IS_OBSERVABLE];

export const of = Observable.of;

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
