import EventEmitter from 'eventemitter3';
import { effect, ReactiveEffectOptions } from '@vue/reactivity';
import { Stack } from './misc';

export type ComponentSource = EventEmitter<{
  mount: () => any;
  update: () => any;
  unmount: () => any;
  throw: (value?: any) => any;

  update_before: () => any;
  update_after: () => any;
  setup_before: () => any;
  setup_after: () => any;
}> & { __parent_source?: ComponentSource };

export let global_source: ComponentSource;
export const newComponentSource = (
  parent_source = global_source
): ComponentSource => {
  const ret = new EventEmitter() as ComponentSource;
  ret.__parent_source = parent_source;
  ret.on('throw', (x) => parent_source?.emit('throw', x));
  return ret;
};
global_source = newComponentSource();
export const hookEffect = (
  fn: () => void,
  options?: ReactiveEffectOptions | undefined
) => {
  const runner = effect(fn, options);
  source_stack.peek()?.once('unmount', () => runner.effect.stop());
  return runner;
};

export const source_stack = new Stack<ComponentSource>();

export const useComponentSource = <RET = ComponentSource>(
  fn: (cs: ComponentSource) => RET = (x) => x as any
) => {
  const cs = source_stack.peek();
  if (!cs) {
    throw new Error(`not found ComponentSource.`);
  }
  return fn(cs);
};
export const useCS = useComponentSource;

export const onMount = (fn: (cs: ComponentSource) => any) =>
  useComponentSource((cs) => cs.once('mount', () => fn(cs)));

export const onUnmount = (fn: (cs: ComponentSource) => any) =>
  useComponentSource((cs) => cs.once('unmount', () => fn(cs)));
