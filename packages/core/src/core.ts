import {
  effect,
  effectScope,
  isReadonly,
  isRef,
  ReactiveEffectRunner,
  unref,
} from '@vue/reactivity';
import { EventEmitter } from 'eventemitter3';
import { UniqIdleScheduler } from './internal/IdleScheduler';
import { shallowEqual } from './internal/shallowEqual';

import { DirectiveDefine } from './directive';
import {
  ReactiveViewElement,
  AnyRecord,
  ViewRenderFunction,
  ComponentArguments,
  ViewRenderResult,
} from './types';
import { skip } from './reactivity';
import { unrefAttribute, unSetAttribute } from './utils';
import { ViewEvent } from './types';
import { AllHTMLElementTagNames, Component } from './types';
import { PropsDiffPatch } from './types';
import { setAttribute } from './utils';

function element2node(element: ReactiveViewElement): Node | null {
  if (element === undefined || element === null) {
    return null;
  }
  if (element instanceof Node) {
    return element;
  }
  if (isRef(element) || typeof element === 'function') {
    const render = isRef(element) ? () => unref(element) : element;
    return rh(() => render);
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
  view: View.anchor2view.get(node),
  key: View.anchor2view.get(node)?.key,
  keyed: !isNoneValue(View.anchor2view.get(node)?.key),
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
      type: 'patch-children';
      oldNode: DiffNode;
      newNode: DiffNode;
      index: number;
      oldComponent: ViewComponent;
      newComponent: ViewComponent;
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
      newNode &&
      oldNode &&
      !newNode.view &&
      !oldNode.view &&
      newNode.node instanceof Text &&
      oldNode.node instanceof Text
    ) {
      // text diff
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
        const insideNewNodes = newNodes.some((x) => x.node === oldNode.node);
        if (!insideNewNodes)
          patches.push({
            type: 'remove',
            index,
            node: oldNode,
          });
      }
    };
    if (newNode?.view && oldNode?.view && newNode.view === oldNode.view) {
      // same view
      continue;
    }
    if (
      newNode?.view?.has_outside_effect ||
      oldNode?.view?.has_outside_effect
    ) {
      replace();
      continue;
    }
    if (
      (newNode?.view && !oldNode?.view) ||
      (!newNode?.view && oldNode?.view)
    ) {
      replace();
    } else if (!newNode || !oldNode) {
      replace();
    } else if (!newNode && !oldNode) {
      replace();
    } else if (newNode.keyed || oldNode.keyed) {
      replace();
    } else if (!newNode.view && !oldNode.view) {
      replace();
    } else if (!newNode.view || !oldNode.view) {
      replace();
    } else {
      const oldView = oldNode.view;
      const newView = newNode.view;

      const oldIsDOM = oldView instanceof DomView;
      const newIsDOM = newView instanceof DomView;
      if ((oldIsDOM && !newIsDOM) || (!oldIsDOM && newIsDOM)) {
        replace();
        continue;
      }

      if (oldIsDOM && newIsDOM) {
        const is_same_dom = oldView.elem.nodeName === newView.elem.nodeName;
        if (!is_same_dom) {
          replace();
          continue;
        }
        const is_changed =
          oldView.elem.nodeName !== newView.elem.nodeName ||
          !shallowEqual(oldView.domProps, newView.domProps) ||
          !shallowEqual(oldView.domChildren, newView.domChildren);
        if (is_changed) {
          patches.push({
            type: 'dom-update',
            oldNode,
            newNode,
            index,
          });
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
      if (!(oldComponent && newComponent)) {
        replace();
        continue;
      }
      const is_changed = !shallowEqual(oldComponent.props, newComponent.props);

      if (is_changed) {
        patches.push({
          type: 'view-patch',
          oldNode,
          newNode,
          index,
        });
      }
      patches.push({
        type: 'patch-children',
        oldNode,
        newNode,
        index,
        oldComponent,
        newComponent,
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
      if (newNode.view instanceof DomView) {
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
  static anchor2view = new WeakMap<Node, View>();
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
    return View.anchor2view.has(node);
  }

  static {
    View.stack.push(View.globalView);
    View.globalView.is_container = true;
  }

  __index = View.getNextIndex();

  scheduler = new UniqIdleScheduler();

  events = new EventEmitter<ViewEvent>();
  status = 'created' as 'created' | 'inited' | 'mounted' | 'unmounted';

  anchor: Node;
  children: Node[] = [];

  context = {} as AnyRecord;

  parentView = View.topView() || View.globalView;

  is_container = false;

  has_outside_effect = false;

  key?: string;

  effectScope = effectScope(true);

  constructor(anchor = View.createAnchor() as Node) {
    this.anchor = anchor;
    (<any>anchor)['__view'] = this;
    View.anchor2view.set(this.anchor, this);

    this.events.on('error', (err) => {
      if (this.events.listenerCount('error') === 1) {
        // feature: Error boundary
        // no consumer should to Propagation
        this.parentView?.events.emit('error', err);
      }
    });
    this.events.on('throw', (err) => {
      if (this.events.listenerCount('throw') === 1) {
        // feature: like Error boundary catch, but throw anything
        // no consumer should to Propagation
        this.parentView?.events.emit('throw', err);
      }
    });
  }

  initialize() {
    if (this.status !== 'created') {
      return;
    }
    this.events.emit('init_before');
    this.events.emit('init');
    this.status = 'inited';
    this.events.emit('init_after');
  }

  querySelector(selector: string): Element | null {
    for (const child of this.children) {
      if (child instanceof Element && child.matches(selector)) {
        return child;
      }
      const view = View.anchor2view.get(child);
      if (view) {
        const elem = view.querySelector(selector);
        if (elem) {
          return elem;
        }
      }
    }
    return null;
  }

  querySelectorAll(selector: string): Element[] {
    const result = [] as Element[];
    for (const child of this.children) {
      if (child instanceof Element && child.matches(selector)) {
        result.push(child);
      }
      const view = View.anchor2view.get(child);
      if (view) {
        const elems = view.querySelectorAll(selector);
        result.push(...elems);
      }
    }
    return result;
  }

  getChildrenParentNode() {
    return this.anchor.parentNode;
  }

  protected mountView(parentElement: Node, insertBefore?: Node | null) {
    if (
      this.anchor === insertBefore &&
      Array.from(parentElement.childNodes.values()).includes(this.anchor as any)
    )
      return;
    parentElement.insertBefore(this.anchor, insertBefore || null);
  }

  mount(parentElement: Node, insertBefore?: Node | null, is_move = false) {
    this.initialize();
    if (is_move) {
      this.events.emit('move_before', parentElement, this.parentView);
    } else {
      this.events.emit('mount_before', parentElement, this.parentView);
    }

    this.mountView(parentElement, insertBefore);

    if (this.anchor instanceof Text) {
      // DomView not need to mount children
      // FIXME: The inheritance relationship is wrong.
      //        It should be DomView => FragmentView => ViewComponent.
      //        The current order is VIew => DomView, View => ViewComponent,
      //        which leads to logic errors and many codes are difficult to understand.
      this.mountChildren(parentElement, is_move);
    }

    if (is_move) {
      this.events.emit('move_after', parentElement, this.parentView);
    } else {
      this.events.emit('mounted', parentElement, this.parentView);
      this.status = 'mounted';
      this.events.emit('mount_after', parentElement, this.parentView);
    }
  }

  protected _fragment: DocumentFragment | undefined;
  protected getChildrenFragment() {
    const fragment = (this._fragment =
      this._fragment || document.createDocumentFragment());
    for (const child of this.children) {
      fragment.appendChild(child);
    }
    return fragment;
  }

  protected mountChildren(parentElement: Node, is_move = false) {
    const fragment = this.getChildrenFragment();
    parentElement.insertBefore(
      fragment,
      // DomView.anchor is a HTMLElement, just children insert to anchor(ParentElement)
      this.anchor === parentElement ? null : this.anchor
    );

    for (const child of this.children) {
      const view = View.anchor2view.get(child);
      if (view) {
        if (view === this) {
          throw new Error(`Cannot mount children to self`);
        }
        view.parentView = this;
        // NOTE: insertBefore => self, Represents keeping the position unchanged, but refreshing the children
        view.mount(parentElement, child, is_move);
      }
    }
  }

  protected first_render = true;
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
    if (this.status === 'unmounted') {
      return;
    }

    const patchTask = () => {
      if (this.status === 'unmounted') {
        return;
      }
      this.events.emit('patch_before');
      const nextChildren = this.patchAll(patches, newChildren);
      this.children = nextChildren.filter(Boolean) as Node[];
    };

    if (this.first_render) {
      // * sync patch (first patch)
      patchTask();
      this.events.emit('patch_after');
      this.first_render = false;
    } else {
      // * async patch
      const task = this.scheduler.runTask('patch-children', patchTask);
      task.promise.then(() => {
        this.events.emit('patch_after');
      });
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
    const parentElement = this.getChildrenParentNode();
    const nextSiblingCache = {} as Record<number, Node | null>;
    const findNextSibling = (index: number): null | Node => {
      if (!parentElement) {
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
        if (child && child?.parentNode === parentElement) {
          nextSiblingCache[current] = child;
          return child;
        }
        current++;
      }
      nextSiblingCache[current] = null;
      return null;
    };
    const insertNode = (node: DiffNode, index: number, is_move = false) => {
      const nextSiblingChild = findNextSibling(index + 1);
      const nextSibling =
        nextSiblingChild?.parentNode === parentElement
          ? nextSiblingChild
          : this.anchor instanceof Text
          ? this.anchor
          : null;
      if (node.view) {
        // unbind new view
        node.view.parentView.children = node.view.parentView.children.filter(
          (child) => child !== node.node
        );
      }
      if (parentElement) {
        if (node.view) {
          node.view.parentView = this;
          node.view.mount(parentElement, nextSibling, is_move);
        } else {
          parentElement.insertBefore(node.node, nextSibling);
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
    const patchDomView = (oldDOM: DomView, newDOM: DomView) => {
      oldDOM.domChildren = newDOM.domChildren;
      oldDOM.domProps = newDOM.domProps;
      oldDOM.updateDom();
      if (newDOM !== oldDOM) {
        // NOTE 因为old和new共用DomChildren，如果newDom unmount会导致错误的dispose
        // FIXME 不应该共用DomChildren，需要引入完整的vnode
        newDOM.children = [];
        newDOM.unmount();
      }
    };
    const patchView = (oldNode: DiffNode, newNode: DiffNode) => {
      const oldView = oldNode.view!;
      const newView = newNode.view!;
      if (oldView instanceof DomView && newView instanceof DomView) {
        patchDomView(oldView, newView);
        return;
      }
      const oldComponent = ViewComponent.view2component.get(oldView);
      const newComponent = ViewComponent.view2component.get(newView);
      if (
        oldComponent &&
        newComponent &&
        oldComponent._component_type === newComponent._component_type
      ) {
        oldComponent.props = newComponent.props;
        oldComponent.state = newComponent.state;
        oldComponent.children = newComponent.children;

        oldComponent.update();
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
            patchView(node, newNode);
          }

          // FIXME this not insert node, just move node, insert === mount, but move not mount
          insertNode(node, to, true);
          removeNode(newNode);
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
          const newComponent = ViewComponent.view2component.get(newNode.view!);
          const oldComponent = ViewComponent.view2component.get(oldNode.view!);
          if (
            newComponent &&
            oldComponent &&
            newComponent._component_type === oldComponent._component_type
          ) {
            patchView(oldNode, newNode);
            removeNode(newNode);
            nextChildren[patch.index] = patch.oldNode.node;
            break;
          }

          replaceNode(oldNode, newNode, index);
          break;
        }
        case 'dom-update': {
          const { newNode, oldNode, index } = patch;
          const newView = newNode.view! as DomView;
          const oldView = oldNode.view! as DomView;
          patchDomView(oldView, newView);
          break;
        }
        case 'text': {
          const { newNode, oldNode, index } = patch;
          (oldNode.node as Text).textContent = (
            newNode.node as Text
          ).textContent;
          break;
        }
        case 'patch-children': {
          const { oldComponent, newComponent } = patch;
          oldComponent.children = newComponent.children;
          oldComponent.update();
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
      const view = View.anchor2view.get(child);
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
    this.status = 'unmounted';
    this.events.emit('unmounted');
    this.events.emit('unmount_after');
    this.events.removeAllListeners();

    this.effectScope.stop();
  }

  unmountChildren() {
    this.remove();
    for (const child of this.children) {
      const view = View.anchor2view.get(child);
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

export class DomView extends View {
  elem: HTMLElement;
  props = {} as AnyRecord;
  constructor(
    tagNameOrNode: string | HTMLElement,
    public domProps: AnyRecord,
    public domChildren: any[]
  ) {
    const elem =
      tagNameOrNode instanceof Node
        ? tagNameOrNode
        : document.createElement(tagNameOrNode);
    super(elem);

    this.elem = elem;
    this.key = domProps['key'];
    delete domProps['key'];

    View.anchor2view.set(this.elem, this);

    this.events.once('init_before', () => {
      this.updateChildren(this.domChildren);
      this.updateDomProps(this.domProps);
    });
  }

  protected mountView(
    parentElement: Node,
    insertBefore?: Node | null | undefined
  ): void {
    if (
      this.elem === insertBefore &&
      Array.from(parentElement.childNodes.values()).includes(this.anchor as any)
    )
      return;
    parentElement.insertBefore(this.elem, insertBefore || null);
  }

  querySelector(selector: string): Element | null {
    if (this.elem instanceof Element && this.elem.matches(selector)) {
      return this.elem;
    }
    return super.querySelector(selector);
  }

  querySelectorAll(selector: string): Element[] {
    const result = [] as Element[];
    if (this.elem instanceof Element && this.elem.matches(selector)) {
      result.push(this.elem);
    }
    result.push(...super.querySelectorAll(selector));
    return result;
  }

  getChildrenParentNode() {
    return this.elem as HTMLElement;
  }

  // NOTE: The behavior here is different from view.mountChildren, because the anchor of the DOM View is a dom element controlled by itself.
  mountChildren(_: any, is_move = false): void {
    super.mountChildren(this.elem, is_move);
  }

  unmount(): void {
    this.elem.parentNode?.removeChild(this.elem);
    Object.values(this.propsCleanups).forEach((cb) => cb());
    this.propsCleanups = {};
    super.unmount();
  }

  remove(): void {
    this.elem.parentNode?.removeChild(this.elem);
    // just remove DomView
    // super.remove();
  }

  updateDom() {
    this.events.emit('update_before');
    try {
      this.updateChildren(this.domChildren);
      this.updateDomProps(this.domProps);
      this.events.emit('updated');
    } finally {
      this.events.emit('update_after');
    }
  }

  protected updateDomProps(props: AnyRecord) {
    if (shallowEqual(props, this.props)) {
      return;
    }
    const patches = this.diffProps(props, this.props);
    if (patches.length === 0) {
      return;
    }
    const patchTask = () => {
      if (this.status === 'unmounted') {
        return;
      }
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
    if (this.first_render) {
      patchTask();
    } else {
      this.scheduler.runTask('patch-task', patchTask);
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
    if (
      key === 'key' ||
      // ignore private props ($xx | _xx) for custom directive
      key.startsWith('$') ||
      key.startsWith('_')
    ) {
      return;
    }

    const element = this.elem;
    if (key === 'ref') {
      if (isRef(value)) {
        if (isReadonly(value)) {
          console.warn(
            `WARNING: ref is readonly, cannot set ref to element <${element.tagName.toLowerCase()}/>, please use ref() instead to get dom.`
          );
        }
        value.value = element;
      } else if (typeof value === 'function') {
        value(element);
      }
      this.addPropCleanup(key, () => {
        if (isRef(value)) {
          value.value = null;
        } else if (typeof value === 'function') {
          value(null);
        }
      });
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
      this.addPropCleanup(key, () => unSetAttribute(element, key));
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
    const scope_event_hook =
      (
        callback?:
          | DirectiveDefine['mounted']
          | DirectiveDefine['unmounted']
          | DirectiveDefine['updated']
      ) =>
      () => {
        if (!callback) return;
        this.effectScope.run(() => {
          const cleanup = this.zone(() => callback(this.elem, value, this));
          cleanup && this.addPropCleanup(key, cleanup);
        });
      };
    const scoped_on_mounted = scope_event_hook(mounted);
    const scoped_on_unmounted = scope_event_hook(unmounted);
    const scoped_on_updated = scope_event_hook(updated);

    if (this.status === 'unmounted') {
      scoped_on_unmounted();
      return; // NOTE: unmounted => no need to setup
    } else {
      this.events.once('unmounted', scoped_on_unmounted, 'directive');
    }

    if (this.status === 'mounted') {
      scoped_on_updated();
      scoped_on_mounted();
    } else {
      this.events.once('mounted', scoped_on_mounted, 'directive');
    }

    this.events.on('updated', scoped_on_updated, 'directive');
  }
}

export class ViewComponent {
  static view2component = new WeakMap<View, ViewComponent>();

  _component_type!: FunctionComponent | SetupComponent;

  render!: ViewRenderFunction;
  update!: ReactiveEffectRunner;

  // NOTE: MUST be readonly
  readonly view = new View();

  props!: AnyRecord;
  state!: AnyRecord;

  // FIXME children type should only writeable (public)
  children = [] as any[];

  constructor() {
    const { view } = this;
    view.is_container = true;
    view.events.once('unmounted', () => this.dispose());
    view.events.once('init_after', () => {
      view.effectScope.run(() => {
        this.update = effect(this._update.bind(this), {
          lazy: false,
          onStop: () => view.events.emit('render_stop'),
          onTrack: (event) => view.events.emit('render_tracked', event),
          onTrigger: (event) => view.events.emit('render_triggered', event),
        });
      });
    });

    ViewComponent.view2component.set(this.view, this);
  }

  patch(props = this.props, state = this.state, children = this.children) {
    this.props = props || this.props;
    this.state = state || this.state;
    this.children = children || this.children;

    this.update();
  }

  protected _update() {
    const { view } = this;
    view.events.emit('update_before');
    try {
      const elements = view.effectScope.run(() =>
        view.zone(
          () => this.render(this.props, this.state, this.children),
          'render'
        )
      );
      // skip() => Compatible with synchronous scheduling
      skip(() =>
        view.updateChildren(Array.isArray(elements) ? elements : [elements])
      );
      view.events.emit('updated');
    } catch (error) {
      setTimeout(() => {
        // next tick trigger
        view.events.emit('error', error);
      });
      console.error(error);
    } finally {
      view.events.emit('update_after');
    }
  }

  protected dispose() {
    this.update?.effect.stop();
  }
}

export type FunctionComponent<P = any, S = any, C = any[]> = {
  (...args: ComponentArguments<P, S, C>):
    | ViewRenderFunction<P, S, C>
    | ViewRenderResult;
};
export type FC<P = any, S = any, C = Array<any>> = (
  props: P,
  state: S,
  children: C
) => ViewRenderFunction<P, S, C>;

const createFCBuilder = (fn: FunctionComponent) => {
  const build = (props: any, children: any[]) => {
    const that = new ViewComponent();
    that.props = props || {};
    that.state = {};
    that.children = children;
    that.view.key = props.key;
    // NOTE: insert before not need to setup
    that.view.events.once('init_before', () => {
      const setup_result = that.view.zone(() =>
        fn(that.props, that.state, that.children)
      );
      if (typeof setup_result === 'function') {
        that.render = setup_result;
      } else {
        that.render = () => setup_result;
      }
    });
    that._component_type = fn;
    return that;
  };
  return build;
};

export type SetupComponent<P = any, S = any, C = any[]> = {
  setup(props: P, children: C): S;
  render: ViewRenderFunction<P, S, C>;
};
const createSetupBuilder = (_type: SetupComponent) => {
  const { setup, render } = _type;
  const build = (props: any, children: any[]) => {
    const that = new ViewComponent();
    that.props = props || {};
    that.children = children;
    that.view.key = props.key;
    // NOTE: insert before not need to setup
    that.view.events.once('init_before', () => {
      that.state =
        that.state ||
        that.view.zone(() => setup(that.props, that.children)) ||
        {};
    });
    that._component_type = _type;
    that.render = render;
    return that;
  };
  return build;
};

export const buildComponent = (
  define: SetupComponent | FunctionComponent,
  props: any,
  children: any[]
) => {
  const builder =
    typeof define === 'function'
      ? createFCBuilder(define)
      : createSetupBuilder(define);
  const component = builder(props, children);
  return component;
};

const anyToView = (viewType: any) => {
  if (viewType instanceof View) {
    return viewType;
  }
  if (viewType instanceof ViewComponent) {
    return viewType.view;
  }
  if (viewType instanceof Node) {
    const view = View.anchor2view.get(viewType);
    if (view) {
      return view;
    }
  }
  return viewType;
};

const normalizeCompileArgs = (viewType: any, props?: any, children?: any[]) => {
  if (props === undefined) {
    // if props not got, children should be undefined.
    // (because children is rest args, so it's always not undefined, it's [])
    children = undefined;
  }
  viewType = anyToView(viewType);
  // NOTE: when args.props,args.children is undefined, should use viewType.props, viewType.children
  const [initProps, initChildren] =
    viewType instanceof DomView
      ? [viewType.domProps, viewType.domChildren]
      : viewType instanceof ViewComponent
      ? [viewType.props, viewType.children]
      : [{}, []];
  props ||= initProps || {};
  children ||= initChildren || [];
  children = children.flat(64);

  return [props, children] as const;
};

export function compile(
  type: AllHTMLElementTagNames,
  props?: any,
  ...children: any[]
): DomView;
export function compile(
  type: FunctionComponent,
  props?: any,
  ...children: any[]
): ViewComponent;
export function compile(
  type: SetupComponent,
  props?: any,
  ...children: any[]
): ViewComponent;
export function compile(
  type: HTMLElement,
  props?: any,
  ...children: any[]
): DomView;
export function compile(type: Text, props?: any, ...children: any[]): View;
export function compile(type: string, props?: any, ...children: any[]): DomView;
export function compile(
  type: any,
  props?: any,
  ...children: any[]
): DomView | View | ViewComponent;
export function compile(
  viewType: any,
  props?: any,
  ...children: any[]
): DomView | View | ViewComponent {
  [props, children] = normalizeCompileArgs(viewType, props, children);

  if (viewType instanceof Node) {
    let view = View.anchor2view.get(viewType);
    if (!view) {
      if (viewType instanceof HTMLElement) {
        view = new DomView(viewType, props, children);
      } else {
        throw new Error(`Unknown node type: ${String(viewType)}`);
      }
    }
    if (view instanceof DomView) {
      view.domChildren = children;
      view.domProps = props;
      // view.updateDom();
    }
    return view;
  }
  if (typeof viewType === 'string' || viewType instanceof String) {
    return new DomView(viewType as any, props, children);
  }
  return buildComponent(viewType, props, children);
}

export function rh(
  type: AllHTMLElementTagNames,
  props?: any,
  ...children: any[]
): Node;
export function rh(
  type: FunctionComponent,
  props?: any,
  ...children: any[]
): Node;
export function rh(type: SetupComponent, props?: any, ...children: any[]): Node;
export function rh(type: Component, props?: any, ...children: any[]): Node;
export function rh(type: Node, props?: any, ...children: any[]): Node;
export function rh(type: string, props?: any, ...children: any[]): Node;
export function rh(
  type: string | Node | Component,
  props?: any,
  ...children: any[]
): Node;
export function rh(
  viewType: string | Node | Component,
  props?: any,
  ...children: any[]
): Node {
  const compiled: DomView | View | ViewComponent = compile(
    viewType,
    props,
    ...children
  );
  if (compiled instanceof ViewComponent) {
    return compiled.view.anchor;
  }
  if (compiled instanceof DomView) {
    return compiled.elem;
  }
  if (compiled instanceof View) {
    return compiled.anchor;
  }
  throw new Error(`Unknown type: ${String(viewType)}`);
}

export function mount(
  selectorOrDom: string | Element,
  node: Node,
  props?: any,
  children?: any[]
): View | DomView;
export function mount(
  selectorOrDom: string | Element,
  component: Component,
  props?: any,
  children?: any[]
): ViewComponent;
export function mount(
  selectorOrDom: string | Element,
  nodeOrComponent: Node | Component,
  props?: any,
  children?: any[]
): ViewComponent | View | DomView {
  const container =
    selectorOrDom instanceof Element
      ? selectorOrDom
      : document.querySelector(selectorOrDom);
  if (!container) throw new Error(`Cannot find container: ${selectorOrDom}`);

  const compiled = compile(nodeOrComponent, props, children);
  const compiledView = compiled instanceof View ? compiled : compiled.view;
  compiledView.mount(container);

  return compiled;
}

export function component<P = any, S = any, C = any[]>(
  define: SetupComponent<P, S, C>
): SetupComponent<P, S, C>;
export function component<P = any, S = any, C = any[]>(
  define: FC<P, S, C>
): FC<P, S, C>;
export function component<P = any, S = any, C = any[]>(
  define: SetupComponent<P, S, C> | FC<P, S, C>
): SetupComponent<P, S, C> | FC<P, S, C> {
  return define;
}

export const useCurrentView = () => View.topView();
export const getCurrentView = () => View.topView();

/**
 * @description Mark the component as having external effects, which will cause all diffs to be disabled when the component is rendered, and each re-rendering will be done with `replace patch`. So only use this method when necessary.
 */
export function markHasOutsideEffect() {
  const view = getCurrentView();
  if (view.zoneFlag !== 'setup') {
    console.warn(
      `Warning: Marking a component with outside-effect at outside "setup" zone may cause unexpected behavior.`
    );
  }
  view.has_outside_effect = true;
}
