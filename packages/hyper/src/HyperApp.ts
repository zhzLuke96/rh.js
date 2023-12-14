import { ViewElement, FC, mount } from "@rhjs/core";
import {
  Effector,
  ReadonlyState,
  HyperContext,
  Subscription,
  Subscriptions,
  hyper,
} from "./hyper";

export class HyperApp<
  State extends Record<keyof any, any> = Record<keyof any, any>
> {
  component: FC<Partial<State>>;

  constructor({
    render,
    initStateOrEffector = {} as State,
    subscriptions,
  }: {
    initStateOrEffector?: State | Effector<State>;
    render: (
      state: ReadonlyState<State> & { children: any[] },
      ctx: HyperContext<State>
    ) => ViewElement;
    subscriptions?: Subscription<State> | Subscriptions<State>;
  }) {
    this.component = hyper<State>(initStateOrEffector, render, subscriptions);
  }

  mount(el: Element) {
    return mount(el, this.component);
  }
}
