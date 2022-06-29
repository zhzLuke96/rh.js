import * as vR from '@vue/reactivity';
const { effect } = vR;

const rmElem = (elem?: Node | null) => elem?.parentElement?.removeChild(elem);

type rhElem = HTMLElement | Comment | number | string | boolean | null;
type rhView = HTMLElement | Comment | null;
type RenderFunc = (props?: Record<string, any>, ...childs: any[]) => rhElem;

type ComponentRender = (ctx: any, ...childs: any[]) => rhElem;
type ComponentSetup = (props?: Record<string, any>) => any;
type Component = { render: ComponentRender; setup: ComponentSetup };

const warpView = (view: rhElem): HTMLElement | Comment | null => {
  if (!view && view !== false && view !== 0) {
    return null;
  }
  if (view instanceof Node) {
    return view;
  }
  return document.createTextNode(`${view}`);
};

function execRender(render: () => rhElem) {
  let container = null as HTMLElement | null;
  let placeholder = document.createComment('');
  let currentView = placeholder as NonNullable<rhView>;
  // if (!container) {
  //   console.warn(`cant find container: ${getContainer.name}`);
  // }
  effect(
    () => {
      const nextView = warpView(render());
      container =
        container || currentView.parentElement || placeholder.parentElement;
      if (nextView) {
        if (currentView && currentView.parentElement === container) {
          container?.replaceChild(nextView, currentView);
        } else if (placeholder.parentElement === container) {
          container?.replaceChild(nextView, placeholder);
        } else if (nextView instanceof Text && currentView instanceof Text) {
          currentView.textContent = nextView.textContent;
          rmElem(placeholder);
          return;
        } else {
          container?.appendChild(nextView);
        }
        rmElem(currentView);
        rmElem(placeholder);
        currentView = nextView;
      } else {
        rmElem(currentView);
        container?.appendChild(placeholder);
        currentView = placeholder;
      }
    },
    { lazy: false }
  );
  container?.appendChild(currentView);
  return currentView;
}
function buildComponent(
  { setup, render }: Component,
  props = {} as Record<string, any>,
  ...childs: any[]
) {
  const ctx = setup(props);
  return execRender(() => render(ctx, ...childs));
}
function buildElement(
  render: RenderFunc,
  props = {} as Record<string, any>,
  ...childs: any[]
) {
  return execRender(() => render(props, ...childs));
}
function patchElement(
  elem: HTMLElement,
  props = {} as Record<string, any>,
  ...childs: any[]
) {
  Object.keys(props || {}).forEach((k) => {
    if (k === 'ref') {
      if (typeof props[k] === 'function') {
        effect(() => props[k](elem));
      }
      return;
    }
    if (!k.startsWith('on') && typeof props[k] === 'function') {
      effect(() => ((elem as any)[k] = props[k]()));
      return;
    }
    if (k.startsWith('on') && typeof props[k] === 'function') {
      elem.addEventListener(k.slice(2), props[k]);
      return;
    }
    (elem as any)[k] = props[k];
  });
  childs.forEach((child) => {
    if (child instanceof Node) {
      elem.appendChild(child);
    } else {
      const text = document.createTextNode(`${child}`);
      elem.appendChild(text);
    }
  });
}
function createElement(
  tagName: string,
  props = {} as Record<string, any>,
  ...childs: any[]
) {
  const elem = document.createElement(tagName);
  patchElement(elem, props, ...childs);
  return elem;
}

const mount = (selector: string, funcOrComp: RenderFunc | Component | Node) => {
  const container = document.querySelector(selector);
  if (typeof funcOrComp === 'function') {
    const view = execRender(funcOrComp);
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
  tagOrFuncOrComp: string | RenderFunc | Component,
  props = {} as Record<string, any>,
  ...childs: any[]
) => {
  if (typeof tagOrFuncOrComp === 'string') {
    return createElement(tagOrFuncOrComp, props, ...childs);
  } else if (typeof tagOrFuncOrComp === 'function') {
    return buildElement(tagOrFuncOrComp, props, ...childs);
  } else {
    return buildComponent(tagOrFuncOrComp, props, ...childs);
  }
};
rh.vR = vR;
rh.mount = mount;
rh.patch = patchElement;
