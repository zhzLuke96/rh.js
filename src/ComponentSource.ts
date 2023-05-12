import EventEmitter from 'eventemitter3';
import { effect, ReactiveEffectOptions } from '@vue/reactivity';
import { Stack } from './misc';
import { symbols } from './constants';

export class ComponentSource extends EventEmitter<{
  mount: (error?: Error) => any; // once
  update: () => any; // many
  unmount: () => any; // once
  throw: (value?: any) => any; // many or zero

  update_before: () => any; // many
  update_after: (error?: Error) => any; // many
  setup_before: () => any; // once (zero)
  setup_after: () => any; // once
}> {
  static global_source = new ComponentSource(undefined);
  static source_stack = new Stack<ComponentSource>();

  static peek() {
    return this.source_stack.peek() || this.global_source;
  }

  __context: Record<keyof any, any> = {};
  __dispose() {
    this.emit('unmount');
    this.removeAllListeners();
  }

  constructor(
    public __parent_source = ComponentSource.global_source as
      | ComponentSource
      | undefined,
    target?: any
  ) {
    super();
    this.on('throw', (x) => __parent_source?.emit('throw', x));
    if (typeof target?.[symbols.CS_HOOK_CB] === 'function') {
      target?.[symbols.CS_HOOK_CB](this);
    }
  }
}

export const global_source = ComponentSource.global_source;

export const hookEffect = (
  fn: () => void,
  options?: ReactiveEffectOptions | undefined
) => {
  const runner = effect(fn, options);
  ComponentSource.peek().once('unmount', () => runner.effect.stop());
  return runner;
};

export const useComponentSource = <RET = ComponentSource>(
  fn: (cs: ComponentSource) => RET = (x) => x as any
) => fn(ComponentSource.peek());
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
