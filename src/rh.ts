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

const rmElem = (elem?: Node | null) => elem?.parentElement?.removeChild(elem);
const symbols = {
  HOOK_CB: Symbol('HOOK_CB'),
};

type AnyRecord = Record<string, any>;
type rhElemRaw = Element | Comment | number | string | boolean | null;
export type rhElem = rhElemRaw | vR.Ref<rhElemRaw>;
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
// TIPS 可以用，但是...setup和render非常有必要分割开
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
  if (vR.isRef(view)) {
    let parentElement = null as null | HTMLElement;
    const marker = document.createTextNode('1');
    let viewValue = marker as ReturnType<typeof warpView>;
    const runner = effect(
      () => {
        parentElement = parentElement || viewValue?.parentElement || null;
        const before = viewValue;
        viewValue = warpView(view.value, cs) || marker;
        if (viewValue !== before && parentElement) {
          parentElement.insertBefore(viewValue, before);
          rmElem(before);
        }
      },
      { lazy: false }
    );
    cs?.once('unmount', () => runner.effect.stop());
    return viewValue;
  }
  if (view instanceof Node) {
    return view;
  }
  return document.createTextNode(`${view}`);
};

function hydrateRender(render: () => rhElem, cs: ComponentSource) {
  let container = null as HTMLElement | null;
  let maker = document.createTextNode('');
  let currentView = maker as NonNullable<rhView>;
  // The first update_after is mount
  cs.once('update_after', (error) => cs.emit('mount', error));

  const renderEffectFn = () => {
    cs.emit('update_before');
    let nextView: NonNullable<rhView>;
    try {
      source_stack.push(cs);
      cs.emit('update');
      nextView = warpView(render(), cs) || maker;
      source_stack.pop();
    } catch (error) {
      // *Because the marker is rendered without a parent the first time, it sends an error to the body by default
      cs.emit('throw', error);
      console.error(error);
      cs.emit('update_after', <any>error);
      return;
    }
    if (container) {
      if (currentView.parentElement === container) {
        container.replaceChild(nextView, currentView);
      } else {
        container.appendChild(nextView);
      }
      rmElem(currentView);
      rmElem(maker);
      currentView = nextView;
    }
    cs.emit('update_after');
  };
  const runner = effect(renderEffectFn, { lazy: true });
  const disposeEvent = onDomInserted(maker, (parent) => {
    container = parent;
    runner.effect.run();
  });
  cs.__parent_source?.once('update_before', () => {
    cs.emit('unmount');
    cs.__parent_source?.once('update_after', () => currentView.remove());
  });
  cs.once('unmount', () => {
    disposeEvent();
    runner.effect.stop();
    cs.removeAllListeners();
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
    if (k === 'ref' || k === 'effect') {
      if (typeof value === 'function') {
        hookEffect(() => value(elem), { lazy: false });
      } else if (vR.isRef(value)) {
        value.value = elem;
      }
      return;
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
  const parent_source = source_stack.peek();
  children
    .map((child) => warpView(child, parent_source))
    .forEach((child) => child && elem.appendChild(child));
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
