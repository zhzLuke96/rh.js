import { ref as _ref, unref as _unref, Ref, UnwrapRef } from "@rhjs/core";

const VALUE_SYMBOL = Symbol("value");
const is_primitive = (value: any) => value !== Object(value);

export type ReactiveValue<T> = T & {
  [VALUE_SYMBOL]: T;
  value: T;
};
export type ReadonlyValue<T> = Readonly<ReactiveValue<T>>;

export function baseRef<T>(
  value: T,
  {
    getter,
    setter,
    readonly,
  }: {
    getter: (params: {
      target: ReactiveValue<T>;
      p: string | symbol;
      receiver: any;
      ref_obj: Ref<UnwrapRef<T>>;
    }) => any;
    setter: (params: {
      target: ReactiveValue<T>;
      p: string | symbol;
      newValue: any;
      receiver: any;
      ref_obj: Ref<UnwrapRef<T>>;
    }) => boolean;
    readonly?: boolean;
  }
): ReactiveValue<T> {
  const ref_obj = _ref(value);
  const is_primitive_value = is_primitive(value);

  const _obj = {
    __v_isRef: true,
    valueOf() {
      return ref_obj.value;
    },
    [Symbol.toPrimitive]() {
      return ref_obj.value as any;
    },
    [Symbol.toStringTag]() {
      return `ReactiveValue<${typeof value}>`;
    },
  } as any as ReactiveValue<T>;
  if (is_primitive_value) {
    return new Proxy(_obj, {
      get: (target, p, receiver) => {
        if (p === VALUE_SYMBOL || p === "value") {
          return ref_obj.value;
        }
        return Reflect.get(target, p, receiver);
      },
      set(target, p, newValue, receiver) {
        if (readonly) return false;
        if (p === VALUE_SYMBOL) {
          ref_obj.value = newValue;
          return true;
        }
        return false;
      },
    });
  }
  return new Proxy(_obj, {
    get: (target, p, receiver) => {
      if (
        p === VALUE_SYMBOL ||
        p === "valueOf" ||
        p === Symbol.toPrimitive ||
        p === Symbol.toStringTag
      ) {
        return ref_obj.value;
      }
      const params = { target, p, receiver, ref_obj };
      return getter(params);
    },
    set(target, p, newValue, receiver) {
      if (readonly) return false;
      if (p === VALUE_SYMBOL) {
        ref_obj.value = newValue;
        return true;
      }
      const params = { target, p, newValue, receiver, ref_obj };
      return setter(params);
    },
  });
}

export function ref<T>(value: T): ReactiveValue<T> {
  return baseRef(value, {
    getter: ({ target, p, receiver, ref_obj }) => {
      if (p === "value") {
        return ref_obj.value;
      }
      return Reflect.get(ref_obj.value as any, p, receiver);
    },
    setter: ({ target, p, newValue, receiver, ref_obj }) => {
      (ref_obj.value as any)[p] = newValue;
      return Reflect.set(ref_obj.value as any, p, newValue, receiver);
    },
  });
}

/**
 * readonly ref
 */
export function readonlyRef<T>(value: T): ReadonlyValue<T> {
  return baseRef(value, {
    readonly: true,
    getter: ({ target, p, receiver, ref_obj }) => {
      if (p === "value") {
        throw new Error(`Cannot read property 'value' of safeRef object`);
      }
      return Reflect.get(ref_obj.value as any, p, receiver);
    },
    setter: ({ target, p, newValue, receiver, ref_obj }) => {
      return false;
    },
  });
}

/**
 * mutate ref
 */
export function mutate<T>(ref_obj: ReactiveValue<T>, value: T) {
  if (ref_obj === null || typeof ref_obj !== "object") throw new Error("!");
  ref_obj[VALUE_SYMBOL] = value;
}

/**
 * unref ref
 */
export function unref<T>(ref_obj: ReactiveValue<T>): T {
  if (VALUE_SYMBOL in ref_obj) {
    return ref_obj[VALUE_SYMBOL];
  }
  return _unref(ref_obj);
}
