import {
  ViewElement,
  unref,
  toRaw,
  FC,
  DeepReadonly,
  UnwrapRef,
  View,
  Ref,
  untrack,
} from "@rhjs/core";
import { createEffect, createState } from "@rhjs/hooks";

const is_func = (x: any): x is (...args: any[]) => any =>
  typeof x === "function";
const is_obj = (x: any): x is Record<keyof any, any> =>
  typeof x === "object" && x !== null;

type UnRefState<State> = {
  [K in keyof State]: State[K] extends Ref<infer T>
    ? T
    : State[K] extends () => infer T
    ? T
    : State[K];
};
export type ReadonlyState<State> = DeepReadonly<UnwrapRef<UnRefState<State>>>;

export type Dispatcher<State> = [act: Action<State>, ...args: any[]];
export type UpdateDate<State> = State | Dispatcher<State> | Effector<State>;
export type Action<State> = (
  state: ReadonlyState<State>,
  ...args: any[]
) => UpdateDate<State>;
export type StateSetter<State> = (date: UpdateDate<State>) => void;
export type Dispatch<State> = (fn: Action<State>, ...args: any[]) => void;
export type Effector<State> = [
  state: State,
  eff: Effecter<State>,
  ...args: any[]
];
export type Effecter<State> = (
  dispatch: Dispatch<State>,
  ...args: any[]
) => void;

export type UnSubscriber = () => void;
export type Subscriber<State> = (
  dispatch: Dispatch<State>,
  ...args: any[]
) => UnSubscriber;
export type Subscription<State> = [
  subscriber: Subscriber<State>,
  ...args: any[]
];
export type Subscriptions<State> = (
  state: ReadonlyState<State>
) => Subscription<State>[];

const is_dispatcher = <State>(state: any): state is Dispatcher<State> =>
  Array.isArray(state) && is_func(state[0]);
const is_effector = <State>(state: any): state is Effector<State> =>
  Array.isArray(state) && state[0] && is_obj(state[0]) && is_func(state[1]);

export type HyperContext<State> = {
  $: (selector: string) => Element | null;
  $$: (selector: string) => Array<Element>;
  id: (id: string) => string;
  $id: (id: string) => Element | null;
  put: (data: State) => void;
  raw: () => ReadonlyState<State>;
  set: StateSetter<State>;
  act: (
    param0: State | Action<State>,
    ...args: any[]
  ) => (...args: any[]) => void;
  patch: Dispatch<State>;
};

const createUnRefState = <State extends Record<keyof any, any>>(
  state: State
) => {
  const [flat, set] = createState<UnRefState<State>>({} as UnRefState<State>);

  const init = { ...state };
  for (const key in init) {
    if (is_func(init[key])) {
      init[key] = init[key]();
    }
  }
  for (const key in init) {
    createEffect(() => {
      const value: any = toRaw(unref(init[key]));
      state[key] = value;
      set((s) => ({ ...s, [key]: value }));
    });
  }
  set(state);

  return [flat, set] as const;
};

const err = (msg: string) => {
  throw new Error(msg);
};

export const hyper =
  <State extends Record<keyof any, any>>(
    initStateOrEffector: State | Effector<State>,
    render: (
      state: ReadonlyState<State> & { children: any[] },
      ctx: HyperContext<State>
    ) => ViewElement,
    subscriptions?: Subscription<State> | Subscriptions<State>
  ): FC<Partial<State>> =>
  (props, _, children) => {
    const vi = View.topView();
    const $ = vi.querySelector.bind(vi);
    const $$ = vi.querySelectorAll.bind(vi);

    const [initState, init_effecter, init_effecter_args] = is_effector<State>(
      initStateOrEffector
    )
      ? [
          initStateOrEffector[0],
          initStateOrEffector[1],
          initStateOrEffector.slice(2),
        ]
      : [initStateOrEffector, void 0, []];

    const [state, _put] = createUnRefState<State>({ ...initState, ...props });
    const raw = () => toRaw(untrack(state));

    let unsubs = [] as UnSubscriber[];
    const patch_subs = () => {
      unsubs.forEach((unsub) => unsub());
      unsubs = (
        subscriptions
          ? Array.isArray(subscriptions)
            ? [subscriptions]
            : subscriptions(raw())
          : []
      ).map(([subscriber, ...args]) => subscriber(dispatch, ...args));
    };
    const patch_effecter = ([state, eff, ...args]: Effector<State>) => (
      put(state), eff(dispatch, ...args)
    );
    const patch_dispatcher = ([act, ...args]: Dispatcher<State>) =>
      set(act(raw(), ...args));

    const put = (data: State): void =>
      data === raw() ? void 0 : (_put(data), patch_subs());
    const set: StateSetter<State> = (data: UpdateDate<State>) =>
      !Array.isArray(data)
        ? put(data)
        : is_effector<State>(data)
        ? patch_effecter(data)
        : is_dispatcher<State>(data)
        ? patch_dispatcher(data)
        : err("Invalid state update: " + JSON.stringify(data));
    const dispatch: Dispatch<State> = (fn: Action<State>, ...args: any[]) =>
      set(fn(raw(), ...args));
    const action: HyperContext<State>["act"] =
      (p0, ...act_args) =>
      (...s_args) =>
        is_func(p0)
          ? dispatch(p0, ...act_args, ...s_args)
          : (set(p0), act_args.map((x) => (is_func(x) ? x() : void 0)));

    const id = (id: string | number) => `${vi.__index}-${id}`;
    const $id = (ids: string | number) => $(`#${id(ids)}`);

    if (init_effecter) {
      init_effecter(dispatch, ...init_effecter_args);
    }

    return () =>
      render(
        { ...unref(state), children },
        {
          $,
          $$,
          id,
          $id,
          put,
          raw,
          set,
          act: action,
          patch: dispatch,
        }
      );
  };
