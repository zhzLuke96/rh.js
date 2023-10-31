import {
  DebuggerEvent,
  effect,
  effectScope,
  isRef,
  ReactiveEffectRunner,
  Ref,
  unref,
} from '@vue/reactivity';
import EventEmitter from 'eventemitter3';
import { UniqIdleScheduler } from './internal/IdleScheduler';
import { shallowEqual } from './internal/shallowEqual';

import { DirectiveDefine, onViewEvent } from './hooks';

export type MaybeRef<T = any> = T | Ref<T>;
export type MaybeRefOrGetter<T = any> = MaybeRef<T> | (() => T);

export type AnyRecord = Record<string, any>;
export type ViewDataType = string | boolean | number | null | undefined | void;
export type ViewElement = Node | ViewDataType;
export type InlineRenderResult = ViewElement | ViewElement[];
export type InlineRender = () => InlineRenderResult;
export type ReactiveElement = InlineRender | Ref<ViewDataType>;
export type ReactiveViewElement = ViewElement | ReactiveElement;
export type ViewRenderResult = ReactiveViewElement | Array<ReactiveViewElement>;
export type ComponentArguments<Props = any, State = any, Children = any[]> = [
  props: Props,
  state: State,
  children: Children
];
export type ViewRenderFunction<Props = any, State = any, Children = any[]> = (
  ...args: ComponentArguments<Props, State, Children>
) => ViewRenderResult;

function element2node(element: ReactiveViewElement): Node | null {
  if (element === undefined || element === null) {
    return null;
  }
  if (element instanceof Node) {
    return element;
  }
  if (isRef(element) || typeof element === 'function') {
    const view = new View();
    view.has_outside_effect = true;
    let runner: ReactiveEffectRunner;
    if (isRef(element)) {
      const text = document.createTextNode('');
      runner = effect(
        () => {
          const textContent = String(unref(element));
          if (textContent !== text.textContent) {
            text.textContent = textContent;
          }
        },
        { lazy: false }
      );
      view.updateChildren([text]);
    } else {
      runner = effect(
        () => {
          const viewChildren = element();
          view.updateChildren(
            Array.isArray(viewChildren) ? viewChildren : [viewChildren]
          );
        },
        { lazy: false }
      );
    }
    view.events.on('unmounted', () => {
      runner.effect.stop();
    });
    return view.anchor;
  }
  return document.createTextNode(String(element));
}

const isNoneValue = (x: any): x is undefined => x === undefined || x === null;

type DiffNode = {
  node: Node;
  view?: View;
  key?: any;
  keyed: boolean;
};
const node2diffNode = (node: Node): DiffNode => ({
  node,
  view: View.dom2view.get(node),
  key: View.dom2view.get(node)?.key,
  keyed: !isNoneValue(View.dom2view.get(node)?.key),
});
type DiffPatch =
  | {
      type: 'move';
      to: number;
      node: DiffNode;
      newNode: DiffNode;
    }
  | {
      type: 'insert';
      index: number;
      node: DiffNode;
    }
  | {
      type: 'remove';
      node: DiffNode;
      index: number;
    }
  | {
      type: 'text';
      oldNode: DiffNode;
      newNode: DiffNode;
      index: number;
    }
  | {
      type: 'dom-update';
      oldNode: DiffNode;
      newNode: DiffNode;
      index: number;
    }
  | {
      type: 'view-patch';
      oldNode: DiffNode;
      newNode: DiffNode;
      index: number;
    };
function diffChildren(newChildren: Node[], oldChildren: Node[]): DiffPatch[] {
  const patches = [] as DiffPatch[];

  const newNodes = newChildren.map(node2diffNode);
  const oldNodes = oldChildren.map(node2diffNode);

  if (newNodes.length === 0) {
    return oldNodes.map((node, index) => ({
      type: 'remove',
      node,
      index,
    }));
  }
  if (oldNodes.length === 0) {
    return newNodes.map((node, index) => ({
      type: 'insert',
      index,
      node,
    }));
  }

  // diff no keyed
  for (
    let index = 0;
    index < Math.max(newNodes.length, oldNodes.length);
    index++
  ) {
    const newNode = newNodes[index] as DiffNode | undefined;
    const oldNode = oldNodes[index] as DiffNode | undefined;

    if (newNode?.node === oldNode?.node) {
      continue;
    }
    if (newNode?.view && oldNode?.view && newNode?.view === oldNode?.view) {
      continue;
    }
    if (newNode?.keyed && oldNode?.keyed) {
      continue;
    }
    if (
      newNode?.node instanceof Text &&
      oldNode?.node instanceof Text &&
      !View.isAnchor(newNode.node) &&
      !View.isAnchor(oldNode.node) &&
      !newNode.view?.has_outside_effect &&
      !oldNode.view?.has_outside_effect
    ) {
      if (newNode.node.textContent !== oldNode.node.textContent) {
        patches.push({
          type: 'text',
          oldNode,
          newNode,
          index,
        });
      }
      continue;
    }
    const replace = () => {
      if (newNode && !newNode.keyed) {
        patches.push({
          type: 'insert',
          index,
          node: newNode,
        });
      }
      if (oldNode && !oldNode.keyed) {
        patches.push({
          type: 'remove',
          index,
          node: oldNode,
        });
      }
    };
    if (!newNode || !oldNode) {
      replace();
    } else if (!newNode && !oldNode) {
      replace();
    } else if (newNode.keyed || oldNode.keyed) {
      replace();
    } else if (!newNode.view && !oldNode.view) {
      replace();
    } else if (!newNode.view || !oldNode.view) {
      replace();
    } else if (
      newNode.view.has_outside_effect ||
      oldNode.view.has_outside_effect
    ) {
      replace();
    } else {
      const oldView = oldNode.view;
      const newView = newNode.view;

      const oldIsDOM = oldView instanceof DOMView;
      const newIsDOM = newView instanceof DOMView;
      if ((oldIsDOM && !newIsDOM) || (!oldIsDOM && newIsDOM)) {
        replace();
        continue;
      }

      if (oldIsDOM && newIsDOM) {
        const isSameDOM = oldView.elem.nodeName === newView.elem.nodeName;
        if (isSameDOM) {
          patches.push({
            type: 'dom-update',
            oldNode,
            newNode,
            index,
          });
        } else {
          replace();
        }
        continue;
      }

      const oldComponent = ViewComponent.view2component.get(oldView);
      const newComponent = ViewComponent.view2component.get(newView);
      if ((!oldComponent && newComponent) || (oldComponent && !newComponent)) {
        replace();
        continue;
      } else if (
        oldComponent?._component_type &&
        newComponent?._component_type &&
        oldComponent._component_type !== newComponent._component_type
      ) {
        replace();
        continue;
      }

      patches.push({
        type: 'view-patch',
        oldNode,
        newNode,
        index,
      });
    }
  }

  // diff keyed
  for (let index = 0; index < newNodes.length; index++) {
    const newNode = newNodes[index] as DiffNode | undefined;
    if (!newNode?.keyed) {
      continue;
    }
    const sameOldIndex = oldNodes.findIndex((node) => node.key === newNode.key);
    if (sameOldIndex === index) {
      if (newNode.view instanceof DOMView) {
        patches.push({
          type: 'dom-update',
          oldNode: oldNodes[sameOldIndex],
          newNode,
          index,
        });
      } else {
        patches.push({
          type: 'view-patch',
          oldNode: oldNodes[sameOldIndex],
          newNode,
          index,
        });
      }
      continue;
    }
    if (sameOldIndex !== -1) {
      patches.push({
        type: 'move',
        to: index,
        node: oldNodes[sameOldIndex],
        newNode,
      });
    } else {
      patches.push({
        type: 'insert',
        index,
        node: newNode,
      });
    }
  }

  for (let index = 0; index < oldNodes.length; index++) {
    const oldNode = oldNodes[index] as DiffNode | undefined;
    if (!oldNode?.keyed) {
      continue;
    }
    const sameNewIndex = newNodes.findIndex((node) => node.key === oldNode.key);
    if (sameNewIndex !== -1) {
      continue;
    }
    patches.push({
      type: 'remove',
      index,
      node: oldNode,
    });
  }

  return patches;
}

export type ViewEvent = {
  init_before: () => any;
  init: () => any;
  init_after: () => any;
  mount_before: (parentElement: Node, parentView: View) => any;
  mounted: (parentElement: Node, parentView: View) => any;
  mount_after: (parentElement: Node, parentView: View) => any;
  unmount_before: () => any;
  unmounted: () => any;
  unmount_after: () => any;
  update_before: () => any;
  updated: () => any;
  update_after: () => any;
  patch_before: () => any;
  patch_after: () => any;
  error: (err: any) => any;
  throw: (value: any) => any;

  // component events
  render_stop: () => any;
  render_tracked: (event: DebuggerEvent) => any;
  render_triggered: (event: DebuggerEvent) => any;
};

export class View {
  static symbols = {
    NONE: Symbol('NONE'),
    DIRECTIVES: Symbol('DIRECTIVES'),
    ANCHOR: Symbol('ANCHOR'),
  };
  static isNone = (x: any): x is Symbol => x === View.symbols.NONE;

  static index = 0;
  static getNextIndex() {
    return ++View.index;
  }
  static dom2view = new WeakMap<Node, View>();
  static stack = [] as View[];
  static topView = () => View.stack[View.stack.length - 1];
  static pushView = (view: View) => View.stack.push(view);
  static popView = () => View.stack.pop();
  static globalView = new View();

  static createAnchor() {
    const anchor = document.createTextNode('');
    (<any>anchor)[View.symbols.ANCHOR] = true;
    return anchor;
  }

  static isAnchor(node: Node) {
    return node instanceof Text && (<any>node)[View.symbols.ANCHOR];
  }

  static {
    View.stack.push(View.globalView);
    View.globalView.is_container = true;
  }

  __index = View.getNextIndex();

  scheduler = new UniqIdleScheduler();

  events = new EventEmitter<ViewEvent>();

  anchor: Node;
  children: Node[] = [];

  context = {} as AnyRecord;

  parentView = View.globalView;

  is_container = false;

  has_outside_effect = false;

  key?: string;

  effectScope = effectScope(true);

  constructor(anchor = View.createAnchor() as Node) {
    this.anchor = anchor;
    View.dom2view.set(this.anchor, this);
    this.events.on('error', (err) => {
      if (this.events.listenerCount('error') === 1) {
        // no consumer should to Propagation
        this.parentView?.events.emit('error', err);
      }
    });
    this.events.on('throw', (err) => {
      if (this.events.listenerCount('throw') === 1) {
        // no consumer should to Propagation
        this.parentView?.events.emit('throw', err);
      }
    });
  }

  protected initialized = false;
  initialize() {
    if (this.initialized) {
      return;
    }
    this.events.emit('init_before');
    this.events.emit('init');
    this.events.emit('init_after');

    this.initialized = true;
  }

  mount(parentElement: Node, insertBefore?: Node | null) {
    this.initialize();
    this.events.emit('mount_before', parentElement, this.parentView);
    parentElement.insertBefore(this.anchor, insertBefore || null);
    this.mountChildren(parentElement);
    this.events.emit('mounted', parentElement, this.parentView);
    this.events.emit('mount_after', parentElement, this.parentView);
  }

  mountChildren(parentElement: Node) {
    if (!parentElement.contains(this.anchor)) {
      throw new Error(
        `Cannot mount children before anchor, anchor not contained in parentElement.`
      );
    }
    for (const child of this.children) {
      parentElement.insertBefore(child, this.anchor);
      const view = View.dom2view.get(child);
      if (view) {
        if (view === this) {
          throw new Error(`Cannot mount children to self`);
        }
        view.parentView = this;
        view.mount(parentElement, child);
      }
    }
  }

  updateChildren(elements: ReactiveViewElement[]) {
    const newChildren = elements
      .flat(64)
      .map((element) => element2node(element))
      .filter(Boolean) as Node[];

    if (this.children.length === 0 && newChildren.length === 0) {
      return;
    }

    const patches = diffChildren(newChildren, this.children);

    if (patches.length === 0) {
      return;
    }

    const patchTask = () => {
      this.events.emit('patch_before');
      const nextChildren = this.patchAll(patches, newChildren);
      this.children = nextChildren.filter(Boolean) as Node[];
    };

    if (this.initialized) {
      // * async patch
      const task = this.scheduler.runTask('patch-children', patchTask);
      task.promise.then(() => {
        this.events.emit('patch_after');
      });
    } else {
      // * sync patch
      patchTask();
      this.events.emit('patch_after');
    }
  }

  protected patchAll(patches: DiffPatch[], newChildren: Node[]) {
    const nextChildren = newChildren.slice();
    this.children.forEach((element, index) => {
      if (nextChildren.length > index) {
        nextChildren[index] = element;
      }
    });
    // flush nextChildren
    patches.forEach((patch) => {
      switch (patch.type) {
        case 'move': {
          nextChildren[patch.to] = patch.node.node;
          break;
        }
        case 'insert': {
          nextChildren[patch.index] = patch.node.node;
          break;
        }
        case 'text': {
          nextChildren[patch.index] = patch.oldNode.node;
          break;
        }
        case 'dom-update': {
          nextChildren[patch.index] = patch.oldNode.node;
          break;
        }
        case 'view-patch': {
          nextChildren[patch.index] = patch.newNode.node;
          break;
        }
      }
    });
    const nextSiblingCache = {} as Record<number, Node | null>;
    const findNextSibling = (index: number): null | Node => {
      if (!this.anchor.parentNode) {
        return null;
      }
      if (this.children.length === 0) {
        return null;
      }
      let current = index;
      while (nextChildren.length > current) {
        if (current in nextSiblingCache) {
          return nextSiblingCache[current];
        }
        const child = nextChildren[current];
        if (child && child?.parentNode === this.anchor.parentNode) {
          nextSiblingCache[current] = child;
          return child;
        }
        current++;
      }
      nextSiblingCache[current] = null;
      return null;
    };
    const insertNode = (node: DiffNode, index: number) => {
      const nextSiblingChild = findNextSibling(index + 1);
      const nextSibling =
        nextSiblingChild?.parentNode === this.anchor.parentNode
          ? nextSiblingChild
          : this.anchor;
      if (node.view) {
        // unbind new view
        node.view.parentView.children = node.view.parentView.children.filter(
          (child) => child !== node.node
        );
      }
      if (this.anchor.parentNode) {
        if (node.view) {
          node.view.parentView = this;
          node.view.mount(this.anchor.parentNode, nextSibling);
        } else {
          this.anchor.parentNode.insertBefore(node.node, nextSibling);
        }
      }
    };
    const removeNode = (node: DiffNode) => {
      if (node.view) {
        node.view.unmount();
      } else {
        node.node.parentNode?.removeChild(node.node);
      }
    };
    const replaceNode = (
      oldNode: DiffNode,
      newNode: DiffNode,
      index: number
    ) => {
      insertNode(newNode, index);
      removeNode(oldNode);
    };
    const updateDomView = (oldDOM: DOMView, newDOM: DOMView) => {
      oldDOM.update(newDOM.DOMProps, newDOM.DOMChildren);
      oldDOM.DOMChildren = newDOM.DOMChildren;
      oldDOM.DOMProps = newDOM.DOMProps;
      if (newDOM !== oldDOM) {
        newDOM.children = [];
        newDOM.unmount();
      }
    };
    const patchView = (oldNode: DiffNode, newNode: DiffNode, index: number) => {
      const oldView = oldNode.view!;
      const newView = newNode.view!;
      if (oldView instanceof DOMView && newView instanceof DOMView) {
        updateDomView(oldView, newView);
        return;
      }
      newView.initialize();
      const oldComponent = ViewComponent.view2component.get(oldView);
      const newComponent = ViewComponent.view2component.get(newView);
      if (oldComponent && newComponent) {
        oldComponent.props = newComponent.props;
        oldComponent.state = newComponent.state;
        oldComponent.children = newComponent.children;
        oldComponent.render = newComponent.render;
        oldComponent.update();
        newComponent.children = [];
        newComponent.view.children = [];
        newView.unmount();
      } else {
        // patch view
        oldView.updateChildren(newView.children);
      }
    };
    for (const patch of patches) {
      switch (patch.type) {
        case 'move': {
          const { to, node, newNode } = patch;

          if (node.view instanceof View && newNode.view instanceof View) {
            patchView(node, newNode, to);
          }

          const nextSiblingChild = findNextSibling(to + 1);
          const nextSibling =
            nextSiblingChild?.parentNode === this.anchor.parentNode
              ? nextSiblingChild
              : this.anchor;
          if (this.anchor.parentNode) {
            if (node.view) {
              node.view.parentView = this;
              node.view.mount(this.anchor.parentNode, nextSibling);
            } else {
              this.anchor.parentNode.insertBefore(node.node, nextSibling);
            }
          }
          newNode.view?.unmount();
          break;
        }
        case 'insert': {
          const { node, index } = patch;
          insertNode(node, index);
          break;
        }
        case 'remove': {
          // here do nothing, remove when all (move/insert) done
          break;
        }
        case 'view-patch': {
          const { newNode, oldNode, index } = patch;
          if (
            oldNode.view?.key !== undefined &&
            newNode.view?.key !== undefined &&
            oldNode.view?.key !== null &&
            newNode.view?.key !== null &&
            newNode.view.key === oldNode.view.key
          ) {
            // same key don't need to patch
            nextChildren[patch.index] = patch.oldNode.node;
            break;
          }
          const newComponent = ViewComponent.view2component.get(newNode.view!);
          const oldComponent = ViewComponent.view2component.get(oldNode.view!);
          if (
            newComponent &&
            oldComponent &&
            newComponent._component_type === oldComponent._component_type &&
            shallowEqual(newComponent.props, oldComponent.props)
          ) {
            oldComponent.props = newComponent.props;
            oldComponent.state = newComponent.state;
            oldComponent.children = newComponent.children;
            // TODO improve render builder to support auto context
            const nView = newComponent.view;
            newComponent.view = oldComponent.view;
            oldComponent.render = newComponent.renderBuilder();
            newComponent.view = nView;
            oldComponent.update();
            newComponent.children = [];
            newComponent.view.children = [];
            newNode.view?.unmount();
            nextChildren[patch.index] = patch.oldNode.node;
            break;
          }

          // *(choice 2)update View
          // NOTE: In order to ensure that the context of the view rendering result remains consistent (the latest render function), it cannot be updated in the form of a patch, only the entire view can be replaced
          // Not sure if non-component view can be directly patched, this needs to be studied further
          // patchView(oldNode, newNode, index);

          // *(choice 2)replace view
          replaceNode(oldNode, newNode, index);
          break;
        }
        case 'dom-update': {
          const { newNode, oldNode, index } = patch;
          const newView = newNode.view! as DOMView;
          const oldView = oldNode.view! as DOMView;
          updateDomView(oldView, newView);
          break;
        }
        case 'text': {
          const { newNode, oldNode, index } = patch;
          (oldNode.node as Text).textContent = (
            newNode.node as Text
          ).textContent;
          break;
        }
      }
    }

    patches.forEach((patch) => {
      if (patch.type !== 'remove') {
        return;
      }
      const { node } = patch;
      removeNode(node);
    });
    return nextChildren;
  }

  remove() {
    for (const child of this.children) {
      child.parentNode?.removeChild(child);
      const view = View.dom2view.get(child);
      if (view) {
        view.remove();
      }
    }
  }

  effect(fn: () => any, stopEvent = 'unmounted' as keyof ViewEvent) {
    return this.effectScope.run(() => {
      const runner = effect(fn, {
        lazy: false,
      });
      if (runner.effect.deps.length === 0) {
        runner.effect.stop();
      } else {
        this.events.once(stopEvent, () => runner.effect.stop());
      }
      return runner;
    });
  }

  unmount() {
    this.events.emit('unmount_before');
    this.scheduler.dispose();
    this.anchor.parentNode?.removeChild(this.anchor);
    this.unmountChildren();
    this.events.emit('unmounted');
    this.events.emit('unmount_after');
    this.events.removeAllListeners();

    this.effectScope.stop();
  }

  unmountChildren() {
    this.remove();
    for (const child of this.children) {
      const view = View.dom2view.get(child);
      if (view) {
        view.unmount();
      }
    }
  }

  zoneFlag = '';
  zone<T>(fn: () => T, zoneFlag = 'setup') {
    const oldFlag = this.zoneFlag;
    View.pushView(this);
    this.zoneFlag = zoneFlag;
    try {
      return fn();
    } finally {
      this.zoneFlag = oldFlag;
      View.popView();
    }
  }

  getContextValue(key: keyof any, match?: (value: any) => boolean) {
    let view = this as View | undefined;
    while (view) {
      const ctx = view.context;
      if (key in ctx) {
        const value = ctx[key as any];
        if (!match) {
          return value;
        }
        if (match(value)) {
          return value;
        }
      }
      view = view.parentView;
    }
    return View.symbols.NONE;
  }

  setContextValue(key: keyof any, value: any) {
    let view = this as View | undefined;
    while (view) {
      if (view.is_container) {
        const ctx = view.context;
        ctx[key as any] = value;
        return;
      }
      view = view.parentView;
    }
    throw new Error(`Cannot set context value: ${String(key)}`);
  }
}

const isStyleElement = (x: Element): x is HTMLElement =>
  x instanceof Element && typeof (<any>x)['style'] === 'object';

const setAttribute = (dom: Element, name: string, value: any) => {
  if (typeof value === 'boolean') {
    if (value) dom.setAttribute(name, '');
    else dom.removeAttribute(name);
    return;
  }
  switch (name) {
    case 'className':
    case 'class': {
      let className = '';
      if (Array.isArray(value)) {
        className = value.join(' ');
      } else if (typeof value === 'object') {
        className = Object.entries(value)
          .filter(([_, v]) => !!v)
          .map(([k]) => k)
          .join(' ');
      } else {
        className = String(value);
      }
      dom.setAttribute('class', className);
      break;
    }
    case 'style': {
      if (!isStyleElement(dom)) {
        break;
      }
      if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => ((dom.style as any)[k] = v));
      } else {
        dom.style.cssText = String(value);
      }
      break;
    }
    case 'value': {
      (dom as any).value = value;
      break;
    }
    default: {
      dom.setAttribute(name, String(value));
      break;
    }
  }
};

const unrefAttribute = (value: any): any => {
  if (typeof value === 'function') {
    return value();
  }
  if (isRef(value)) {
    return unref(value);
  }
  if (Array.isArray(value)) {
    return value.map(unrefAttribute);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, unrefAttribute(v)])
    );
  }
  return unref(value);
};

type PropsDiffPatch = {
  type: 'remove' | 'patch';
  key: string;
  value: any;
};
export class DOMView extends View {
  elem: Node;
  props = {} as AnyRecord;
  constructor(
    tagNameOrNode: string | Node,
    public DOMProps: AnyRecord,
    public DOMChildren: any[]
  ) {
    super();

    this.elem =
      tagNameOrNode instanceof Node
        ? tagNameOrNode
        : document.createElement(tagNameOrNode);
    this.key = DOMProps['key'];
    delete DOMProps['key'];

    View.dom2view.set(this.elem, this);
  }

  initialize() {
    if (this.initialized) {
      return;
    }
    this.events.emit('init_before');
    this.events.emit('init');
    this.update(this.DOMProps, this.DOMChildren);
    this.events.emit('init_after');

    this.initialized = true;
  }

  mount(parentElement: Node, insertBefore?: Node | null) {
    this.initialize();
    this.events.emit('mount_before', parentElement, this.parentView);
    parentElement.insertBefore(this.elem, insertBefore || null);
    this.elem.appendChild(this.anchor);
    this.mountChildren();
    this.events.emit('mounted', parentElement, this.parentView);
    this.events.emit('mount_after', parentElement, this.parentView);
  }

  update(props: AnyRecord, children: any[]) {
    this.events.emit('update_before');
    try {
      this.updateChildren(children);
      if (!shallowEqual(props, this.props)) {
        this.updateProps(props);
        this.props = props;
      }
      this.events.emit('updated');
    } finally {
      this.events.emit('update_after');
    }
  }

  protected updateProps(props: AnyRecord) {
    if (shallowEqual(props, this.props)) {
      return;
    }
    const patches = this.diffProps(props, this.props);
    if (patches.length === 0) {
      return;
    }
    const patchTask = () => {
      for (const patch of patches) {
        const { type, key, value } = patch;
        switch (type) {
          case 'patch': {
            this.patchProp(key, value);
            this.props[key] = value;
            break;
          }
          case 'remove': {
            this.cleanupProp(key);
            delete this.props[key];
            break;
          }
        }
      }
    };
    if (this.initialized) {
      this.scheduler.runTask('patch-task', patchTask);
    } else {
      patchTask();
    }
  }

  protected propsCleanups = {} as Record<string, () => void>;
  protected addPropCleanup(key: string, cleanup: () => any) {
    const prev_callback = this.propsCleanups[key];
    this.propsCleanups[key] = () => {
      prev_callback?.();
      cleanup();
    };
  }
  protected cleanupProp(key: string) {
    this.propsCleanups[key]?.();
    delete this.propsCleanups[key];
  }

  protected patchProp(key: string, value: any) {
    this.cleanupProp(key);

    this.matchDirectives(key, value);
    if (key.startsWith('$') || key.startsWith('_') || key === 'key') {
      return;
    }

    const element = this.elem;
    if (key === 'ref') {
      if (isRef(value)) {
        value.value = element;
      } else if (typeof value === 'function') {
        value(element);
      }
      return;
    }
    if (!(element instanceof Element)) {
      return;
    }
    if (key.startsWith('on')) {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);

      const removeHandler = () => element.removeEventListener(eventName, value);
      this.events.once('unmounted', removeHandler);

      const disposeEventHandler = () => {
        this.events.off('unmounted', removeHandler);
        element.removeEventListener(eventName, value);
      };
      this.addPropCleanup(key, disposeEventHandler);
    } else {
      const runner = this.effect(() => {
        const element = this.elem;
        if (!(element instanceof Element)) {
          return;
        }
        const nextValue = unrefAttribute(value);

        setAttribute(element, key, nextValue);
      });
      this.addPropCleanup(key, () => runner?.effect.stop());
    }
  }

  protected diffProps(newProps: AnyRecord, oldProps: AnyRecord) {
    const patches = [] as PropsDiffPatch[];
    Object.entries(newProps).forEach(([key, value]) => {
      if (Object.is(oldProps[key], value)) {
        return;
      }
      patches.push({
        type: 'patch',
        key,
        value,
      });
    });
    Object.entries(oldProps).forEach(([key, value]) => {
      if (key in newProps) {
        return;
      }
      patches.push({
        type: 'remove',
        key,
        value,
      });
    });
    return patches;
  }

  protected matchDirectives(key: string, value: any) {
    const directives = this.getContextValue(
      View.symbols.DIRECTIVES,
      (x) => !!x?.[key]
    );
    if (!directives) {
      return;
    }
    const directive = directives[key] as DirectiveDefine;
    if (!directive) {
      return;
    }
    const { mounted, unmounted, updated } = directive;
    mounted &&
      this.events.once(
        'mounted',
        () => {
          this.effectScope.run(() => {
            const cleanup = this.zone(() => mounted(this.elem, value, this));
            cleanup && this.addPropCleanup(key, cleanup);
          });
        },
        'directive'
      );
    unmounted &&
      this.events.once(
        'unmounted',
        () => {
          this.effectScope.run(() => {
            const cleanup = this.zone(() => unmounted(this.elem, value, this));
            cleanup && this.addPropCleanup(key, cleanup);
          });
        },
        'directive'
      );
    updated &&
      this.events.on(
        'updated',
        () => {
          this.effectScope.run(() => {
            const cleanup = this.zone(() => updated(this.elem, value, this));
            cleanup && this.addPropCleanup(key, cleanup);
          });
        },
        'directive'
      );
  }

  mountChildren(): void {
    const parentElement = this.elem;
    for (const child of this.children) {
      parentElement.insertBefore(child, this.anchor);
      const view = View.dom2view.get(child);
      if (view) {
        if (view === this) {
          throw new Error(`Cannot mount children to self`);
        }
        view.parentView = this;
        view.mount(parentElement, child);
      }
    }
  }

  unmount(): void {
    this.elem.parentNode?.removeChild(this.elem);
    Object.values(this.propsCleanups).forEach((cb) => cb());
    this.propsCleanups = {};
    super.unmount();
  }
}

export class ViewComponent {
  static view2component = new WeakMap<View, ViewComponent>();

  _component_type!: FunctionComponent | SetupComponent;

  renderBuilder!: () => ViewRenderFunction;
  render!: ViewRenderFunction;
  runner!: ReactiveEffectRunner;

  view = new View();

  props = {} as AnyRecord;
  state = {} as AnyRecord;
  children = [] as any[];

  constructor() {
    this.view.is_container = true;
    this.view.events.once('unmounted', () => this.dispose());
    this.view.events.once('init_after', () => {
      this.view.effectScope.run(() => {
        this.runner = effect(this.update.bind(this), {
          lazy: false,
          onStop: () => this.view.events.emit('render_stop'),
          onTrack: (event) => this.view.events.emit('render_tracked', event),
          onTrigger: (event) =>
            this.view.events.emit('render_triggered', event),
        });
      });
    });

    ViewComponent.view2component.set(this.view, this);
  }

  update() {
    this.view.events.emit('update_before');
    try {
      const elements = this.view.effectScope.run(() =>
        this.view.zone(
          () => this.render(this.props, this.state, this.children),
          'render'
        )
      );
      this.view.updateChildren(Array.isArray(elements) ? elements : [elements]);
      this.view.events.emit('updated');
    } catch (error) {
      setTimeout(() => {
        // next tick trigger
        this.view.events.emit('error', error);
      });
      console.error(error);
    } finally {
      this.view.events.emit('update_after');
    }
  }

  dispose() {
    this.runner?.effect.stop();
  }
}

export type FunctionComponent<P = any, S = any, C = any[]> = {
  (...args: ComponentArguments<P, S, C>): ViewRenderFunction<P, S, C>;
};
export type FC<P = any, S = any, C = Array<any>> = (
  props: P,
  state: S,
  children: C
) => ViewRenderFunction<P, S, C>;

const createFCBuilder = (fn: FunctionComponent) => {
  const build = (props: any, children: any[]) => {
    const comp = new ViewComponent();
    comp.props = props;
    comp.children = children;
    comp.view.key = props.key;
    comp.view.events.once('init', () => {
      comp.render = comp.view.zone(() => fn(props, comp.state, comp.children));
    });
    comp._component_type = fn;
    comp.renderBuilder = () =>
      comp.view.zone(() => fn(props, comp.state, comp.children));
    return comp;
  };
  return build;
};

export type SetupComponent<P = any, S = any, C = any[]> = {
  setup(props: P, children: C): S;
  render: ViewRenderFunction<P, S, C>;
};
const createSetupBuilder = (define: SetupComponent) => {
  const build = (props: any, children: any[]) => {
    const comp = new ViewComponent();
    comp.props = props;
    comp.children = children;
    comp.view.key = props.key;
    comp.view.events.once('init', () => {
      comp.state = comp.view.zone(() => define.setup(props, children));
    });
    comp._component_type = define;
    comp.render = define.render;
    comp.renderBuilder = () => define.render;
    return comp;
  };
  return build;
};

const buildComponent = (
  define: SetupComponent | FunctionComponent,
  props: any,
  children: any[]
) => {
  let builder: (props: AnyRecord, children: any[]) => ViewComponent;
  if (typeof define === 'function') {
    builder = createFCBuilder(define);
  } else {
    builder = createSetupBuilder(define);
  }
  const component = builder(props, children);
  return component;
};

export type Component<P = any, S = any, C = any[]> =
  | FunctionComponent<P, S, C>
  | SetupComponent<P, S, C>;

export const rh = (
  type: string | Node | FunctionComponent | SetupComponent,
  props: any = {},
  ...children: any[]
): Node => {
  props ||= {};
  children ||= [];
  children = children.flat(64);

  if (type instanceof Node) {
    const view = View.dom2view.get(type);
    if (!view) {
      new DOMView(type, props, children);
    } else if (view instanceof DOMView) {
      view.update(props, children);
    }
    return type;
  }
  if (typeof type === 'string' || type instanceof String) {
    const domView = new DOMView(type as any, props, children);
    return domView.elem;
  }
  const component = buildComponent(type, props, children);
  return component.view.anchor;
};

export function mount(selectorOrDom: string | Element, node: Node): void;
export function mount(
  selectorOrDom: string | Element,
  component: Component,
  props?: any
): ViewComponent;
export function mount(
  selectorOrDom: string | Element,
  nodeOrComponent: Node | Component,
  props?: any
) {
  const container =
    selectorOrDom instanceof Element
      ? selectorOrDom
      : document.querySelector(selectorOrDom);
  if (!container) throw new Error('Could not find selector');
  if (nodeOrComponent instanceof Node) {
    const view = View.dom2view.get(nodeOrComponent);
    if (!view) {
      container.appendChild(nodeOrComponent);
    } else {
      view.mount(container);
    }
  } else {
    const component = buildComponent(nodeOrComponent, props || {}, []);
    component.view.mount(container);
    return component;
  }
}

export const component = <P = any, S = any, C = any[]>(
  define: SetupComponent<P, S, C> | FC<P, S, C>
) => define;
