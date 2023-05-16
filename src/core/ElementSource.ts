import { effect, ReactiveEffectOptions, stop } from '@vue/reactivity';
import EventEmitter from 'eventemitter3';
import { symbols } from '../constants';
import { Stack } from '../common/Stack';

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
    return this.source_stack.peek() || this.global_source;
  }

  __parent_source = ElementSource.source_stack.peek();
  __container_source = this as ElementSource | undefined;

  private states = {
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
    this.on('mount', () => (this.states.mounted = true));
    this.on('unmount', () => (this.states.unmounted = true));

    this.__parent_source.once('unmount', () => {
      this.dispose();
      this.emit('unmount');
    });

    if (!lazy_unmount) {
      // The update_after event of the second parent is equal to unmount
      this.__parent_source.once('update_after', () => {
        this.__parent_source?.once('update_after', () => {
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
  }

  onUnmount(fn: () => any) {
    if (this.states.unmounted) {
      fn();
    } else {
      this.once('unmount', fn);
    }
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
    this.__context = {};
  }

  effect<T>(fn: () => T, options?: ReactiveEffectOptions) {
    const runner = effect(fn, options);
    this.once('unmount', () => stop(runner));
    return runner;
  }
}
