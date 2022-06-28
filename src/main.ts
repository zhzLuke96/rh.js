import * as vR from '@vue/reactivity';
const { effect } = vR;

const rmElem = (elem?: Node | null) => elem?.parentElement?.removeChild(elem);
const nextTick = (cb: () => void) => Promise.resolve().then(cb);
const nextEffect: typeof effect = (...args) =>
  nextTick(() => effect(...args)) as any;

type rhElem = HTMLElement | Comment | number | string | boolean | null;
type rhView = HTMLElement | Comment | null;
type RenderFunc = (props?: Record<string, any>, ...childs: any[]) => rhElem;

type ComponentRender = (ctx: any, ...childs: any[]) => rhElem;
type ComponentSetup = (props?: Record<string, any>) => any;
type Component = {render: ComponentRender, setup: ComponentSetup};

const warpView = (view: rhElem): HTMLElement | Comment | null => {
  if (!view && view !== false && view !== 0) {
    return null;
  }
  if (view instanceof Node) {
    return view;
  }
  return document.createTextNode(`${view}`);
};

function mountContainer(
  getContainer: () => HTMLElement | undefined | null,
  func: RenderFunc
) {
  let container = getContainer();
  let placeholder = document.createComment('');
  let currentView = null as rhView;
  // if (!container) {
  //   console.warn(`cant find container: ${getContainer.name}`);
  // }
  nextEffect(() => {
    const nextView = warpView(func());
    container = container || getContainer();
    if (!container) {
      return;
    }
    if (nextView) {
      if (currentView && currentView.parentElement === container) {
        container.replaceChild(nextView, currentView);
      } else if (placeholder.parentElement === container) {
        container.replaceChild(nextView, placeholder);
      } else if (nextView instanceof Text && currentView instanceof Text) {
        currentView.textContent = nextView.textContent;
        rmElem(placeholder);
        return;
      } else {
        container.appendChild(nextView);
      }
      rmElem(currentView);
      rmElem(placeholder);
    } else {
      rmElem(currentView);
      container.appendChild(placeholder);
    }
    currentView = nextView;
  });
}
function buildComponent({setup, render}: Component,
  props = {} as Record<string, any>,
  ...childs: any[]) {
  const ctx = setup(props);
  const placeholder = document.createComment('');
  mountContainer(
    () => placeholder.parentElement,
    () => render(ctx, ...childs)
  );
  return placeholder;
}
function buildElement(
  render: RenderFunc,
  props = {} as Record<string, any>,
  ...childs: any[]
) {
  const placeholder = document.createComment('');
  mountContainer(
    () => placeholder.parentElement,
    () => render(props, ...childs)
  );
  return placeholder;
}
function createElement(
  tagName: string,
  props = {} as Record<string, any>,
  ...childs: any[]
) {
  const elem = document.createElement(tagName);
  Object.keys(props || {}).forEach((k) => {
    if (k === 'ref') {
      if (typeof props[k] === 'function') {
        props[k](elem);
      }
      return;
    }
    if (!k.startsWith('on') && typeof props[k] === 'function') {
      effect(() => (elem as any)[k] = props[k]());
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
  return elem;
}

const mount = (selector: string, funcOrComp: RenderFunc | Component) =>{
  if (typeof funcOrComp === 'function') {
    mountContainer(() => document.querySelector(selector) as HTMLElement, funcOrComp);
    return;
  }
  if (typeof funcOrComp === 'object') {
    const placeholder = buildComponent(funcOrComp);
    const container = document.querySelector(selector);
    if (container) {
      container.appendChild(placeholder);
    }
    return;
  }
};

/**
 * reactivity text node
 */
const rt = (strs: TemplateStringsArray, ...slots: Array<() => any>) => {
  const ret = [] as Text[];
  for (let idx = 0; idx < strs.length; idx++) {
    const text = strs[idx];
    ret.push(document.createTextNode(text));
    const slot = slots[idx];
    if (!slot || typeof slot !== 'function') {
      continue;
    }
    const slotNode = document.createTextNode('');
    effect(() => slotNode.textContent = slot());
    ret.push(slotNode);
  }
  return ret;
}

/**
 * reactivity hydrate
 */
const rh = (
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
rh.rt = rt;
export default rh;
