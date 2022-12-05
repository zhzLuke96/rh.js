import * as vR from '@vue/reactivity';
const { effect } = vR;

const rmElem = (elem?: Node | null) => elem?.parentElement?.removeChild(elem);
const cleanupElem = (elem?: Node | null) => {
  elem?.dispatchEvent(
    new Event('cleanup', { bubbles: false, composed: false })
  );
  elem?.childNodes.forEach(cleanupElem);
};
const throwErrFromElem = (err: Error, elem?: Node | null) =>
  elem?.dispatchEvent(
    new CustomEvent('rh-err', {
      detail: err,
      bubbles: true,
      composed: false,
    })
  );

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
export type FC<Props extends AnyRecord = AnyRecord> = FunctionComponent<Props>;

export const warpView = (view: rhElem): Element | Comment | null => {
  if (!view && view !== false && view !== 0) {
    return null;
  }
  if (vR.isRef(view)) {
    let parentElement = null as null | HTMLElement;
    const marker = document.createTextNode('1');
    let viewValue = marker as ReturnType<typeof warpView>;
    effect(
      () => {
        parentElement = parentElement || viewValue?.parentElement || null;
        const before = viewValue;
        viewValue = warpView(view.value) || marker;
        if (viewValue !== before && parentElement) {
          parentElement.insertBefore(viewValue, before);
          rmElem(before);
        }
      },
      { lazy: false }
    );
    return viewValue;
  }
  if (view instanceof Node) {
    return view;
  }
  return document.createTextNode(`${view}`);
};

function execRender(render: () => rhElem) {
  let container = null as HTMLElement | null;
  let maker = document.createTextNode('');
  let currentView = maker as NonNullable<rhView>;
  effect(
    () => {
      let nextView: NonNullable<rhView>;
      try {
        nextView = warpView(render()) || maker;
      } catch (error) {
        // *Because the marker is rendered without a parent the first time, it sends an error to the body by default
        throwErrFromElem(error, currentView.parentElement || document.body);
        // FIXME first error will lose
        return;
      }
      container = container || currentView.parentElement || maker.parentElement;
      if (currentView.parentElement === container) {
        container?.replaceChild(nextView, currentView);
        cleanupElem(currentView);
      } else if (nextView instanceof Text && currentView instanceof Text) {
        currentView.textContent = nextView.textContent;
        rmElem(maker);
        return;
      } else {
        container?.appendChild(nextView);
      }
      rmElem(currentView);
      cleanupElem(currentView);
      rmElem(maker);
      currentView = nextView;
    },
    { lazy: false }
  );
  return currentView;
}
function buildFunctionComponent(
  fc: FunctionComponent,
  props = {} as AnyRecord,
  ...children: any[]
) {
  const render = fc(props, ...children.map(warpView));
  return execRender(() => render());
}
function buildComponent(
  { setup, render }: SetupComponent,
  props = {} as AnyRecord,
  ...children: any[]
) {
  const ctx = setup(props, ...children);
  return execRender(() => render(ctx, ...children.map(warpView)));
}
function hydrateElement(
  elem: Element,
  props = {} as AnyRecord,
  ...children: any[]
) {
  Object.keys(props || {}).forEach((k) => {
    if (k === 'ref' || k === 'effect') {
      if (typeof props[k] === 'function') {
        effect(() => props[k](elem), { lazy: false });
      }
      return;
    }
    if (!k.startsWith('on') && typeof props[k] === 'function') {
      effect(() => elem.setAttribute(k, props[k]()), { lazy: false });
      return;
    }
    if (k.startsWith('on') && typeof props[k] === 'function') {
      const old_cb = (elem as any)['__cb_' + k];
      old_cb && elem.removeEventListener(k.slice(2), old_cb);
      (elem as any)['__cb_' + k] = props[k];
      elem.addEventListener(k.slice(2), props[k]);
      return;
    }
    elem.setAttribute(k, props[k]);
  });
  children.map(warpView).forEach((child) => child && elem.appendChild(child));
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
  funcOrComp: FunctionComponent | SetupComponent | Node
) => {
  const container = document.querySelector(selector);
  if (typeof funcOrComp === 'function') {
    const view = buildFunctionComponent(funcOrComp);
    container?.appendChild(view);
    return;
  }
  if (funcOrComp instanceof Node) {
    container?.appendChild(funcOrComp);
    return;
  }
  if (typeof funcOrComp === 'object') {
    const placeholder = buildComponent(funcOrComp);
    container?.appendChild(placeholder);
    return;
  }
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
