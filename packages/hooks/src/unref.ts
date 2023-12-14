import { unref, UnwrapRef, untrack } from "@rhjs/core";

type UnRefArray<T extends any[]> = {
  [K in keyof T]: UnwrapRef<T[K]>;
};

export const depend = <Args extends any[]>(...args: Args) =>
  args.map((x) => unref(x)) as UnRefArray<Args>;

export const unrefAll = depend;

export const untrackAll = <Args extends any[]>(...args: Args) =>
  args.map((x) => untrack(x)) as UnRefArray<Args>;
