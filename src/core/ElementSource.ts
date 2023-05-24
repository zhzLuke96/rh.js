import { effect, ReactiveEffectOptions, stop } from '@vue/reactivity';
import EventEmitter from '../common/EventEmitter';
// import EventEmitter from 'eventemitter3';
import { symbols } from '../constants';
import { Stack } from '../common/Stack';
import { globalIdleScheduler } from '../common/IdleScheduler';
import { AnyRecord } from './types';

export type ElementSourceEventTypes = {
  mount: (elem: Node, parentNode: Node) => any; // once
  update: () => any; // many
  unmount: () => any; // once
  throw: (value?: any) => any; // many or zero

  update_before: () => any; // many
  update_after: (error?: Error) => any; // many
  setup_before: () => any; // once (zero)
  setup_after: () => any; // once
};

export type DirectiveFunction = (
  value: any,
  element: Element | undefined,
  source: ElementSource,
  host?: any
) => any;

export type DirectiveDefine = {
  key: string;
  hooks: {
    [K in keyof ElementSourceEventTypes]?: DirectiveFunction;
  };
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

  constructor(public host?: any, readonly lazy_unmount?: boolean) {
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
    const emitIdleDispose = () => {
      this.idleEmit('unmount');
      this.dispose();
    };

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
    this.__context = {};
    this.__directive_callbacks = {};
  }

  effect<T>(fn: () => T, options?: ReactiveEffectOptions) {
    const runner = effect(fn, options);
    if (!options?.lazy && runner.effect.deps.length === 0) {
      stop(runner);
    } else {
      this.once('unmount', () => stop(runner));
    }
    return runner;
  }

  throw(value: any, options?: { sync?: boolean; async?: boolean }) {
    const handler = () => this.emit('throw', value);
    if (options?.sync) {
      handler();
    } else if (options?.async) {
      // Throw the error in the next tick and emit an event to indicate the update failure
      // This avoids merging effects if the component receiving the error is the same as the current component
      setTimeout(handler, 0);
    } else {
      globalIdleScheduler.runTask(handler);
    }
  }

  getContextValue(
    key: keyof any,
    options: {
      hit_container?: boolean;
      throw_error?: boolean;
      default_value?: any;
    } = {}
  ) {
    let source = options?.hit_container ? this.__container_source : this;
    while (source) {
      const context = source.__context;
      if (key in context) {
        return context[key];
      }
      source = source.__parent_source;
    }
    if (options?.throw_error) {
      throw new Error(`Cannot find context for key '${String(key)}'`);
    }
    if ('default_value' in options) {
      this.setContextValue(key, options.default_value, {
        hit_container: options.hit_container,
      });
      return options.default_value;
    }
    return undefined;
  }

  setContextValue(
    key: keyof any,
    value: any,
    options?: { hit_container?: boolean }
  ) {
    const source = options?.hit_container ? this.__container_source : this;
    if (!source) {
      throw new Error(`Cannot find context`);
    }
    source.__context[key] = value;
  }

  matchDirective(directive: string) {
    let source = this as ElementSource | undefined;
    while (source) {
      const context = source.__context;
      if (
        symbols.DIRECTIVES in context &&
        context[symbols.DIRECTIVES] &&
        typeof context[symbols.DIRECTIVES] === 'object' &&
        context[symbols.DIRECTIVES][directive]
      ) {
        return context[symbols.DIRECTIVES][directive] as DirectiveDefine;
      }
      source = source.__parent_source;
    }
    return undefined;
  }

  enableDirective(directive_define: DirectiveDefine) {
    this.__context[symbols.DIRECTIVES] ||= {};
    const directives = this.__context[symbols.DIRECTIVES];
    directives[directive_define.key] = directive_define;
  }

  private __directive_callbacks = {} as AnyRecord;
  updateDirectiveCallback(directiveDefine: DirectiveDefine, value: any) {
    const { hooks } = directiveDefine;
    for (const [dirKey, dirCb] of Object.entries(hooks)) {
      const old_cb = this.__directive_callbacks[dirKey];
      if (old_cb) {
        this.off(dirKey as any, old_cb);
      }
      const getNode = () => this.host?.elem || this.host?.currentView;
      const cb = (this.__directive_callbacks[dirKey] = () =>
        dirCb(value, getNode(), this, this.host));
      this.on(dirKey as any, cb);
    }
  }

  updateDirectiveFromProps(props: AnyRecord) {
    const directives_key = Object.keys(props);
    for (const key of directives_key) {
      const directiveDefine = this.matchDirective(key);
      if (!directiveDefine) {
        continue;
      }
      const value = props[key];
      this.updateDirectiveCallback(directiveDefine, value);
    }
  }
}

// initialize global source
ElementSource.source_stack.push(ElementSource.global_source);
