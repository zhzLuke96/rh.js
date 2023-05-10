import * as vR from '@vue/reactivity';
import { skip } from './reactivity';
import {
  ComponentSource,
  source_stack,
  hookEffect,
  newComponentSource,
} from './ComponentSource';
import { onDomInserted } from './misc';

const { effect } = vR;

const removeElem = (elem?: Node | null) =>
  elem?.parentElement?.removeChild(elem);
const symbols = {
  HOOK_CB: Symbol('HOOK_CB'),
  IS_ANCHOR: Symbol('IS_ANCHOR'),
};
const createViewAnchor = () => {
  const viewAnchor = document.createTextNode('');
  (<any>viewAnchor)[symbols.IS_ANCHOR] = true;
  return viewAnchor;
};

type AnyRecord = Record<string, any>;
type rhElemRaw = Element | Comment | number | string | boolean | null;
type effectElement = () => rhElemRaw;
export type rhElem = rhElemRaw | vR.Ref<rhElemRaw> | effectElement;
export type rhView = Element | Comment | null;
export type RenderFunc<ChildrenList extends any[] = any[]> = (
  props: AnyRecord,
  ...children: ChildrenList
) => rhElem;

type ComponentRender<Ctx, ChildrenList extends any[]> = (
  ctx: Ctx,
  ...children: ChildrenList
) => rhElem;
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
// *JUST TS Syntactic sugar
const component = <Props extends AnyRecord = AnyRecord, Ctx = any>(
  comp: SetupComponent<Props, Ctx>
) => comp;

export type FunctionComponent<
  Props extends AnyRecord = AnyRecord,
  Children extends any[] = any[]
> = (props: Props, ...children: Children) => () => rhElem;

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
  view: rhElem,
  cs?: ComponentSource
): Element | Comment | null => {
  if (!view && view !== false && view !== 0) {
    return null;
  }
  if (vR.isRef(view) || typeof view === 'function') {
    let parentElement = null as null | HTMLElement;
    const viewAnchor = createViewAnchor();
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
    cs?.once('unmount', () => {
      runner.effect.stop();
      disposeEvent();
    });
    return currentView;
  }
  if (view instanceof Node) {
    return view;
  }
  return document.createTextNode(`${view}`);
};

function hydrateRender(render: () => rhElem, cs: ComponentSource) {
  const viewAnchor = createViewAnchor();
  let viewParentElement = null as HTMLElement | null;
  let currentView = viewAnchor as NonNullable<rhView>;
  // The first update_after is mount
  cs.once('update_after', (error) => cs.emit('mount', error));

  const renderEffectFn = () => {
    cs.emit('update_before');
    let nextView: NonNullable<rhView>;
    try {
      source_stack.push(cs);
      cs.emit('update');
      nextView = warpView(render(), cs) || viewAnchor;
      source_stack.pop();
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
    cs.emit('update_after');
  };
  // TIPS: don't replace effect to hookEffect
  const runner = effect(renderEffectFn, { lazy: false });
  const disposeEvent = onDomInserted(currentView, (parent, source) => {
    disposeEvent();
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
  cs.__parent_source?.once('update_before', () => {
    cs.emit('unmount');
    cs.__parent_source?.once('update_after', () => currentView.remove());
  });
  cs.once('unmount', () => {
    disposeEvent();
    runner.effect.stop();
    cs.removeAllListeners();
    // Remove Anchor only when unmount
    removeElem(viewAnchor);
  });
  return currentView;
}
function buildFunctionComponent(
  fn: FunctionComponent,
  props = {} as AnyRecord,
  ...children: any[]
) {
  const hookCallback = (<any>fn)[symbols.HOOK_CB];
  const cs = newComponentSource(source_stack.peek());
  if (typeof hookCallback === 'function') {
    hookCallback(cs);
  }
  cs.emit('setup_before');
  const render = skip(() => {
    source_stack.push(cs);
    const ret = fn({ ...props, __component_source: cs }, ...children);
    source_stack.pop();
    return ret;
  });
  cs.emit('setup_after');
  return hydrateRender(() => render(), cs);
}
function buildComponent(
  component: SetupComponent,
  props = {} as AnyRecord,
  ...children: any[]
) {
  const { setup, render } = component;
  const hookCallback = (<any>component)[symbols.HOOK_CB];
  const cs = newComponentSource(source_stack.peek());
  if (typeof hookCallback === 'function') {
    hookCallback(cs);
  }
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
    const parent_source = source_stack.peek();
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
  if (typeof funcOrComp === 'function') {
    const view = buildFunctionComponent(funcOrComp, props, ...children);
    view && container?.appendChild(view);
    return;
  }
  if (funcOrComp instanceof Node) {
    container?.appendChild(funcOrComp);
    return;
  }
  if (typeof funcOrComp === 'object') {
    const placeholder = buildComponent(funcOrComp, props, ...children);
    container?.appendChild(placeholder);
    return;
  }
};

/**
 * hook component into ComponentSource
 */
const hookComponent = <T extends FunctionComponent | SetupComponent>(
  component: T,
  hookCallback: (cs: ComponentSource) => any
): T => {
  (<any>component)[symbols.HOOK_CB] = hookCallback;
  return component;
};

const createThrowAny = () => {
  const self_source = source_stack.peek();
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
    return buildFunctionComponent(<any>one, props, ...children);
  } else if (one instanceof Element) {
    hydrateElement(one, props, ...children);
    return one;
  } else {
    return buildComponent(<any>one, props, ...children);
  }
};
rh.mount = mount;
rh.component = component;
rh.createThrowAny = createThrowAny;
rh.hookComponent = hookComponent;
