import type { DebuggerEvent, Ref } from '@vue/reactivity';
import type { View } from './core';
import type { FunctionComponent, SetupComponent } from './core';

export type AnyRecord = Record<string, any>;
export type ViewDataType = string | boolean | number | null | undefined | void;
export type ViewElement = Node | ViewDataType;
export type InlineRenderResult = ViewElement | ViewElement[];
export type InlineRender = () => InlineRenderResult;
export type ReactiveElement = InlineRender | Ref<ViewDataType>;
export type ReactiveViewElement = ViewElement | ReactiveElement;
export type ViewRenderResult = ReactiveViewElement | Array<ReactiveViewElement>;
export type ComponentArguments<Props = any, State = any, Children = any[]> = [
  props: Props,
  state: State,
  children: Children
];
export type ViewRenderFunction<Props = any, State = any, Children = any[]> = (
  ...args: ComponentArguments<Props, State, Children>
) => ViewRenderResult;
export type ViewEvent = {
  init_before: () => any;
  init: () => any;
  init_after: () => any;

  mount_before: (parentElement: Node, parentView: View) => any;
  mounted: (parentElement: Node, parentView: View) => any;
  mount_after: (parentElement: Node, parentView: View) => any;

  move_before: (parentElement: Node, parentView: View) => any;
  move_after: (parentElement: Node, parentView: View) => any;

  unmount_before: () => any;
  unmounted: () => any;
  unmount_after: () => any;

  update_before: () => any;
  updated: () => any;
  update_after: () => any;

  patch_before: () => any;
  patch_after: () => any;

  error: (err: any) => any;
  throw: (value: any) => any;

  // component events
  render_stop: () => any;
  render_tracked: (event: DebuggerEvent) => any;
  render_triggered: (event: DebuggerEvent) => any;
};
export type Component<P = any, S = any, C = any[]> =
  | FunctionComponent<P, S, C>
  | SetupComponent<P, S, C>;

export type AllHTMLElementTagNames =
  | keyof HTMLElementTagNameMap
  | keyof SVGElementTagNameMap;
export type PropsDiffPatch = {
  type: 'remove' | 'patch';
  key: string;
  value: any;
};
