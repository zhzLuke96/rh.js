import { effect, ReactiveEffectOptions, stop } from '@vue/reactivity';
import EventEmitter from '../common/EventEmitter';
// import EventEmitter from 'eventemitter3';
import { symbols } from '../constants';
import { Stack } from '../common/Stack';
import { globalIdleScheduler } from '../common/IdleScheduler';

export type ElementSourceEventTypes = {
  mount: () => any; // once
  update: () => any; // many
  unmount: () => any; // once
  throw: (value?: any) => any; // many or zero

  update_before: () => any; // many
  update_after: (error?: Error) => any; // many
  setup_before: () => any; // once (zero)
  setup_after: () => any; // once
};

export class ElementSource extends EventEmitter<ElementSourceEventTypes> {
  static source_stack = new Stack<ElementSource>();
  static global_source = new ElementSource();

  __context = {} as Record<keyof any, any>;

  static peek() {
    return ElementSource.source_stack.peek() || ElementSource.global_source;
  }

  __parent_source = ElementSource.source_stack.peek();
  __container_source = this as ElementSource | undefined;

  states = {
    mounted: false,
    unmounted: false,
  };

  constructor(public host?: any, lazy_unmount?: boolean) {
    super();

    if (!this.__parent_source) {
      // global source not have parent source
      return;
    }

    this.setupContainerSource();

    // throw link
    this.on('throw', (x) => this.__parent_source?.emit('throw', x));

    // sync state
    this.once('mount', () => (this.states.mounted = true));
    this.once('unmount', () => (this.states.unmounted = true));

    // poor man's time slice cleanup
    const emitIdleDispose = () =>
      globalIdleScheduler.runTask(async () => {
        this.idleEmit('unmount', () => this.dispose());
      });

    if (lazy_unmount) {
      // - If the current source host is a component that supports lazy unmounting:
      //   - It needs to establish a link to the top-level container source.
      //   - The link is created by accessing `__container_source.__parent_source.__container_source`.
      // - This link helps to ensure proper handling of the component's unmount event.
      // - The unmount event may be delayed until a later time to optimize application performance.
      // - Note that:
      //   - `__container_source` refers to the immediate container source of the component， which could also be self (this).
      //   - `__parent_source` represents the parent source of the container source, which could also be a component.
      const lazy_container =
        this.__container_source === this
          ? this.__container_source.__parent_source?.__container_source
          : this.__container_source;
      (lazy_container || this.__parent_source).once('unmount', emitIdleDispose);
    } else {
      this.__parent_source.once('unmount', emitIdleDispose);
      // `update_after` event of the second from parent is equal to sub-component `unmount`
      this.__parent_source.once('update_after', () => {
        this.__parent_source!.once('update_after', () => {
          this.emit('unmount');
        });
      });
    }
  }

  onMount(fn: () => any) {
    if (this.states.mounted) {
      fn();
    } else {
      this.once('mount', fn);
    }
    return this;
  }

  onUnmount(fn: () => any) {
    if (this.states.unmounted) {
      fn();
    } else {
      this.once('unmount', fn);
    }
    return this;
  }

  // find component level source
  private setupContainerSource() {
    while (
      this.__container_source &&
      this.__container_source !== ElementSource.global_source
    ) {
      if (this.__container_source.host?.[symbols.IS_COMPONENT]) {
        break;
      }
      this.__container_source = this.__container_source.__parent_source;
    }
  }

  dispose() {
    this.removeAllListeners();
    delete (<any>this).__context;
  }

  effect<T>(fn: () => T, options?: ReactiveEffectOptions) {
    const runner = effect(fn, options);
    this.once('unmount', () => stop(runner));
    return runner;
  }
}
