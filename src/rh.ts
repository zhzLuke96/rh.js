import * as vR from '@vue/reactivity';
import { skip } from './reactivity';
import { ComponentSource, hookEffect } from './ComponentSource';
import { onDomInserted } from './misc';
import { symbols } from './constants';

const { effect } = vR;

const removeElem = (elem?: Node | null) =>
  elem?.parentElement?.removeChild(elem);
const createViewAnchor = (cs: ComponentSource) => {
  const viewAnchor = document.createTextNode('');
  (<any>viewAnchor)[symbols.IS_ANCHOR] = true;
  (<any>viewAnchor)[symbols.SELF_CS] = cs;
  return viewAnchor;
};

type AnyRecord = Record<string, any>;
type ReactiveElementRaw = Element | Comment | number | string | boolean | null;
/**
 * Element-Render within a special effect
 *
 * This type is a local rendering function that limits rendering to a specific side effect,
 * reducing its overall (parent element) impact.
 *
 * NOTE: This function will finally be called in the warpView function to render
 */
type ReactiveElementRender = () => ReactiveElementRaw;
export type ReactiveElement =
  | ReactiveElementRaw
  | vR.Ref<ReactiveElementRaw>
  | ReactiveElementRender;
export type ReactiveView = Element | Comment | null;
export type RenderFunc<ChildrenList extends any[] = any[]> = (
  props: AnyRecord,
  ...children: ChildrenList
) => ReactiveElement;

type ComponentRender<Ctx, ChildrenList extends any[]> = (
  ctx: Ctx,
  ...children: ChildrenList
) => ReactiveElement;
type ComponentSetup<Props, Ctx, ChildrenList extends any[]> = (
  props: Props,
  ...children: ChildrenList
) => Ctx;
export type SetupComponent<
  Props extends AnyRecord = AnyRecord,
  Ctx = any,
  ChildrenList extends any[] = any[]
> = {
  setup: ComponentSetup<Props, Ctx, ChildrenList>;
  render: ComponentRender<Ctx, ChildrenList>;
};
export const isSetupComponent = (obj: any): obj is SetupComponent =>
  typeof obj === 'object' &&
  obj !== null &&
  typeof obj.setup === 'function' &&
  typeof obj.render === 'function';

/**
 * This function returns the original value, similar to an `identity` function, but with added TypeScript type checking.
 * It can be used to link the `setup` and `render` functions together, making it a syntactic sugar of sorts.
 */
const component = <Props extends AnyRecord = AnyRecord, Ctx = any>(
  comp: SetupComponent<Props, Ctx>
) => comp;

export type FunctionComponent<
  Props extends AnyRecord = AnyRecord,
  Children extends any[] = any[]
> = (props: Props, ...children: Children) => () => ReactiveElement;

// WARN 这个类型是可以用，但是...setup和render非常有必要分割开，所以不要在core里实现这个类型
// export type ShortFunctionComponent<Props extends AnyRecord = AnyRecord> = (
//   props?: Props,
//   ...children: any[]
// ) => rhElem;

export type FC<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[]
> = FunctionComponent<Props, ChildrenList>;

export const warpView = (
  view: ReactiveElement,
  cs: ComponentSource
): Element | Comment | null => {
  if (!view && view !== false && view !== 0) {
    return null;
  }
  if (vR.isRef(view) || typeof view === 'function') {
    let parentElement = null as null | HTMLElement;
    const viewAnchor = createViewAnchor(cs);
    let currentView = viewAnchor as ReturnType<typeof warpView>;
    const runner = effect(
      () => {
        parentElement = parentElement || currentView?.parentElement || null;
        const before = currentView;
        const effectView = typeof view === 'function' ? view() : view.value;
        currentView = warpView(effectView, cs) || viewAnchor;
        if (currentView !== before && parentElement) {
          parentElement.insertBefore(currentView, before);
          removeElem(before);
        }
        (<any>currentView)[symbols.SELF_CS] = cs;
      },
      { lazy: false }
    );
    const disposeEvent = onDomInserted(
      currentView || viewAnchor,
      (parent, source) => {
        disposeEvent();
        parentElement = parent;
        if (currentView && source !== currentView) {
          parentElement.insertBefore(currentView, source);
          removeElem(source);
        }
      }
    );
    cs.once('unmount', () => {
      runner.effect.stop();
      disposeEvent();
      removeElem(viewAnchor);
      removeElem(currentView);
    });
    return currentView;
  }
  if (view instanceof Node) {
    return view;
  }
  return document.createTextNode(`${view}`);
};

function hydrateRender(render: () => ReactiveElement, cs: ComponentSource) {
  const viewAnchor = createViewAnchor(cs);
  let viewParentElement = null as HTMLElement | null;
  let currentView = viewAnchor as NonNullable<ReactiveView>;

  const renderEffectFn = () => {
    cs.emit('update_before');
    let nextView: NonNullable<ReactiveView>;
    try {
      ComponentSource.source_stack.push(cs);
      cs.emit('update');
      nextView = warpView(render(), cs) || viewAnchor;
      ComponentSource.source_stack.pop();
    } catch (error) {
      requestAnimationFrame(() => {
        // *If the component receiving throw is the component itself, it may cause the effect to be merged, so you need to throw at next-tick
        cs.emit('throw', error);
        console.error(error);
      });
      cs.emit('update_after', <any>error);
      return;
    }
    if (viewParentElement) {
      viewParentElement.insertBefore(
        nextView,
        currentView.parentElement === viewParentElement
          ? currentView
          : viewAnchor
      );
      if (!(<any>currentView)[symbols.IS_ANCHOR]) {
        removeElem(currentView);
      }
    }
    currentView = nextView;
    (<any>currentView)[symbols.SELF_CS] = cs;
    cs.emit('update_after');
  };

  // TIPS: don't replace effect to hookEffect
  const renderEffectRunner = effect(renderEffectFn, { lazy: false });
  const disposeEvent = onDomInserted(currentView, (parent, source) => {
    disposeEvent();
    cs.emit('mount');

    viewParentElement = parent;
    // inject anchor
    if (viewAnchor !== source) {
      parent.insertBefore(viewAnchor, source);
    }
    if (source !== currentView) {
      parent.insertBefore(currentView, source);
      if (!(<any>source)[symbols.IS_ANCHOR]) {
        removeElem(source);
      }
    }
  });
  cs.__parent_source?.once('unmount', () => cs.emit('unmount'));
  cs.__parent_source?.once('update_before', () => {
    cs.emit('unmount');
    cs.__parent_source?.once('update_after', () => currentView.remove());
  });
  cs.once('unmount', () => {
    disposeEvent();
    renderEffectRunner.effect.stop();
    cs.removeAllListeners();
    // Remove Anchor only when unmount
    removeElem(viewAnchor);
    removeElem(currentView);
  });
  return currentView;
}
function buildFunctionComponent(
  fn: FunctionComponent,
  cs = new ComponentSource(ComponentSource.peek(), fn),
  props = {} as AnyRecord,
  ...children: any[]
) {
  cs.emit('setup_before');
  const render = skip(() => {
    ComponentSource.source_stack.push(cs);
    const ret = fn({ ...props, __component_source: cs }, ...children);
    ComponentSource.source_stack.pop();
    return ret;
  });
  cs.emit('setup_after');
  return hydrateRender(() => render(), cs);
}
function buildComponent(
  component: SetupComponent,
  cs = new ComponentSource(ComponentSource.peek(), component),
  props = {} as AnyRecord,
  ...children: any[]
) {
  const { setup, render } = component;
  cs.emit('setup_before');
  const ctx = setup({ ...props, __component_source: cs }, ...children) || {};
  ctx.__component_source = cs;
  cs.emit('setup_after');
  return hydrateRender(() => render(ctx, ...children), cs);
}
function hydrateElement(
  elem: Element,
  props = {} as AnyRecord,
  ...children: any[]
) {
  Object.keys(props || {}).forEach((k) => {
    if (k.startsWith('__')) {
      return;
    }
    const value = props[k];
    switch (k) {
      case 'ref': {
        if (typeof value === 'function') {
          value(elem);
        } else if (vR.isRef(value)) {
          value.value = elem;
        }
        return;
      }
      case 'effect': {
        if (typeof value === 'function') {
          hookEffect(() => value(elem), { lazy: false });
        }
        return;
      }
      default: {
        break;
      }
    }
    if (!k.startsWith('on') && typeof value === 'function') {
      hookEffect(() => elem.setAttribute(k, value()), { lazy: false });
      return;
    }
    if (k.startsWith('on') && typeof value === 'function') {
      const evKey = k.slice(2).toLowerCase();
      const old_cb = (elem as any)['__cb_' + k];
      old_cb && elem.removeEventListener(evKey, old_cb);
      (elem as any)['__cb_' + k] = value;
      elem.addEventListener(evKey, value);
      return;
    }
    hookEffect(
      () => {
        const val = vR.unref(props[k]);
        if (typeof val === 'boolean') {
          val ? elem.setAttribute(k, '') : elem.removeAttribute(k);
        } else {
          elem.setAttribute(k, val);
        }
      },
      { lazy: false }
    );
  });
  // *To prevent unnecessary rendering and performance overhead, we use `skip` to avoid the effect-binding triggered by `DOM insertion event` causing parent-effect to depend on dependencies of its grandchildren components.
  skip(() => {
    const parent_source = ComponentSource.peek()!;
    children
      .map((child) => warpView(child, parent_source))
      .forEach((child) => child && elem.appendChild(child));
  });
}
function createElement(
  tagName: string,
  props = {} as AnyRecord,
  ...children: any[]
) {
  const elem = document.createElement(tagName);
  hydrateElement(elem, props, ...children);
  return elem;
}
const mount = (
  selectorOrDom: string | HTMLElement,
  funcOrComp: FunctionComponent | SetupComponent | Node,
  props?: AnyRecord,
  ...children: any[]
) => {
  const container =
    selectorOrDom instanceof Node
      ? selectorOrDom
      : document.querySelector(selectorOrDom);
  const cs = new ComponentSource(ComponentSource.peek(), funcOrComp);
  if (typeof funcOrComp === 'function') {
    const view = buildFunctionComponent(funcOrComp, cs, props, ...children);
    view && container?.appendChild(view);
    return cs;
  }
  if (isSetupComponent(funcOrComp)) {
    const placeholder = buildComponent(funcOrComp, cs, props, ...children);
    container?.appendChild(placeholder);
    return cs;
  }
  if (funcOrComp instanceof Node) {
    cs.__dispose();
    container?.appendChild(funcOrComp);
    return (<any>funcOrComp)[symbols.SELF_CS] as ComponentSource;
  }
  throw new Error(`Invalid component type: ${typeof funcOrComp}`);
};

/**
 * hook component into ComponentSource
 */
const hookComponent = <T extends FunctionComponent | SetupComponent>(
  component: T,
  hookCallback: (cs: ComponentSource) => any
): T => {
  (<any>component)[symbols.CS_HOOK_CB] = hookCallback;
  return component;
};

const createThrowAny = () => {
  const self_source = ComponentSource.peek();
  return (val: any) => self_source?.emit('throw', val);
};

/**
 * reactivity hydrate
 */
export const rh = <
  Props extends AnyRecord = AnyRecord,
  Ctx = any,
  ChildrenList extends any[] = any[]
>(
  one:
    | string
    | FunctionComponent<Props, ChildrenList>
    | SetupComponent<Props, Ctx, ChildrenList>
    | Element,
  props = {} as Props,
  ...children: ChildrenList
) => {
  children = <any>(children?.flat() || children);
  if (typeof one === 'string') {
    return createElement(one, props, ...children);
  } else if (typeof one === 'function') {
    return buildFunctionComponent(<any>one, undefined, props, ...children);
  } else if (one instanceof Element) {
    hydrateElement(one, props, ...children);
    return one;
  } else {
    return buildComponent(<any>one, undefined, props, ...children);
  }
};
rh.mount = mount;
rh.component = component;
rh.createThrowAny = createThrowAny;
rh.hookComponent = hookComponent;
