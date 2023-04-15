import * as vR from '@vue/reactivity';
import { skip } from './reactivity';
import {
  ComponentSource,
  source_stack,
  global_source,
  hookEffect,
  newComponentSource,
} from './ComponentSource';

const { effect } = vR;

const rmElem = (elem?: Node | null) => elem?.parentElement?.removeChild(elem);
const symbols = {
  HOOK_CB: Symbol('HOOK_CB'),
};

type AnyRecord = Record<string, any>;
type rhElemRaw = Element | Comment | number | string | boolean | null;
export type rhElem = rhElemRaw | vR.Ref<rhElemRaw>;
export type rhView = Element | Comment | null;
export type RenderFunc = (props?: AnyRecord, ...children: any[]) => rhElem;

type ComponentRender<Ctx> = (ctx: Ctx, ...children: any[]) => rhElem;
type ComponentSetup<Props, Ctx> = (props: Props, ...children: any[]) => Ctx;
export type SetupComponent<Props extends AnyRecord = AnyRecord, Ctx = any> = {
  setup: ComponentSetup<Props, Ctx>;
  render: ComponentRender<Ctx>;
};
// *JUST TS Syntactic sugar
const component = <Props extends AnyRecord = AnyRecord, Ctx = any>(
  comp: SetupComponent<Props, Ctx>
) => comp;

export type FunctionComponent<Props extends AnyRecord = AnyRecord> = (
  props?: Props,
  ...children: any[]
) => () => rhElem;
// TIPS 可以用，但是...setup和render非常有必要分割开
// export type ShortFunctionComponent<Props extends AnyRecord = AnyRecord> = (
//   props?: Props,
//   ...children: any[]
// ) => rhElem;
export type FC<Props extends AnyRecord = AnyRecord> = FunctionComponent<Props>;

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

function execRender(render: () => rhElem, cs: ComponentSource) {
  let container = null as HTMLElement | null;
  let maker = document.createTextNode('');
  let currentView = maker as NonNullable<rhView>;
  const runner = effect(
    () => {
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
        cs.emit('update_after');
        return;
      }
      container = container || currentView.parentElement || maker.parentElement;
      if (currentView.parentElement === container) {
        container?.replaceChild(nextView, currentView);
      } else if (nextView instanceof Text && currentView instanceof Text) {
        currentView.textContent = nextView.textContent;
        rmElem(maker);
        return;
      } else {
        container?.appendChild(nextView);
      }
      rmElem(currentView);
      rmElem(maker);
      currentView = nextView;
      cs.emit('update_after');
    },
    { lazy: false }
  );
  cs.__parent_source?.once('update', () => cs.emit('unmount'));
  cs.once('unmount', () => {
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
  const hookCallback = fn[symbols.HOOK_CB];
  const cs = newComponentSource(source_stack.peek());
  if (typeof hookCallback === 'function') {
    hookCallback(cs);
  }
  cs.emit('setup_before');
  const render = skip(() => {
    source_stack.push(cs);
    const ret = fn(
      { ...props, __component_source: cs },
      ...children.map((child) => warpView(child, cs))
    );
    source_stack.pop();
    return ret;
  });
  cs.emit('setup_after');
  return execRender(() => render(), cs);
}
function buildComponent(
  component: SetupComponent,
  props = {} as AnyRecord,
  ...children: any[]
) {
  const { setup, render } = component;
  const hookCallback = component[symbols.HOOK_CB];
  const cs = newComponentSource(source_stack.peek());
  if (typeof hookCallback === 'function') {
    hookCallback(cs);
  }
  cs.emit('setup_before');
  const ctx = setup({ ...props, __component_source: cs }, ...children) || {};
  ctx.__component_source = cs;
  cs.emit('setup_after');
  return execRender(
    () => render(ctx, ...children.map((child) => warpView(child, cs))),
    cs
  );
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
  selector: string,
  funcOrComp: FunctionComponent | SetupComponent | Node,
  props?: AnyRecord,
  ...children: any[]
) => {
  const container = document.querySelector(selector);
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
export const hookComponent = <T extends FunctionComponent | SetupComponent>(
  component: T,
  hookCallback: (cs: ComponentSource) => any
): T => {
  component[symbols.HOOK_CB] = hookCallback;
  return component;
};

export const createThrowAny = () => {
  const self_source = source_stack.peek();
  return (val: any) => self_source?.emit('throw', val);
};

/**
 * reactivity hydrate
 */
export const rh = (
  one: string | FunctionComponent | SetupComponent | Element,
  props = {} as AnyRecord,
  ...children: any[]
) => {
  children = children?.flat() || children;
  if (typeof one === 'string') {
    return createElement(one, props, ...children);
  } else if (typeof one === 'function') {
    return buildFunctionComponent(one, props, ...children);
  } else if (one instanceof Element) {
    hydrateElement(one, props, ...children);
    return one;
  } else {
    return buildComponent(one, props, ...children);
  }
};
rh.vR = vR;
rh.mount = mount;
rh.component = component;
rh.createThrowAny = createThrowAny;
rh.hookComponent = hookComponent;
