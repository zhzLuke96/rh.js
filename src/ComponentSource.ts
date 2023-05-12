import EventEmitter from 'eventemitter3';
import { effect, ReactiveEffectOptions } from '@vue/reactivity';
import { Stack } from './misc';
import { symbols } from './constants';

export type ComponentSource = EventEmitter<{
  mount: (error?: Error) => any; // once
  update: () => any; // many
  unmount: () => any; // once
  throw: (value?: any) => any; // many or zero

  update_before: () => any; // many
  update_after: (error?: Error) => any; // many
  setup_before: () => any; // once (zero)
  setup_after: () => any; // once
}> & { __parent_source?: ComponentSource; __context: Record<keyof any, any> };

export let global_source: ComponentSource;
export const newComponentSource = (
  parent_source = global_source,
  target?: any
): ComponentSource => {
  const cs = new EventEmitter() as ComponentSource;
  cs.__parent_source = parent_source;
  cs.__context = {};
  cs.on('throw', (x) => parent_source?.emit('throw', x));
  if (typeof target?.[symbols.CS_HOOK_CB] === 'function') {
    target?.[symbols.CS_HOOK_CB](cs);
  }
  return cs;
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

type DisposeFn = () => any;
export const onMount = (fn: (cs: ComponentSource) => any) =>
  useComponentSource<DisposeFn>((cs) => {
    const handler = () => fn(cs);
    cs.once('mount', handler);
    return () => cs.off('mount', handler);
  });

export const onUnmount = (fn: (cs: ComponentSource) => any) =>
  useComponentSource<DisposeFn>((cs) => {
    const handler = () => fn(cs);
    cs.once('unmount', handler);
    return () => cs.off('unmount', handler);
  });

export const onCatch = (fn: (value: any, cs: ComponentSource) => any) =>
  useComponentSource<DisposeFn>((cs) => {
    const handler = (value: any) => fn(value, cs);
    cs.once('throw', handler);
    return () => cs.off('throw', handler);
  });
