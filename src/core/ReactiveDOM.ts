import { isRef, pauseTracking, resetTracking, unref } from '@vue/reactivity';
import { cheapRemoveElem } from '../common/cheapRemoveElem';
import { symbols } from '../constants';
import { ElementSource } from './ElementSource';
import { ReactiveElement } from './ReactiveElement';

// tag + props + children => ReactiveDOM
export class ReactiveDOM {
  static instances = new WeakMap<Element, ReactiveDOM>();
  static createReactiveDOM(
    tagNameOrDome: string | Element,
    props: Record<keyof any, any>,
    children: any[]
  ) {
    if (tagNameOrDome instanceof Element) {
      const ins = ReactiveDOM.instances.get(tagNameOrDome);
      if (ins) {
        ins.update(props, children);
        return ins;
      }
    }
    const ins = new ReactiveDOM(tagNameOrDome, props, children);
    ReactiveDOM.instances.set(ins.node, ins);
    return ins;
  }

  node!: Element;
  source = new ElementSource(this);

  listeners = {} as Record<string, (...args: any[]) => any>;

  constructor(
    private tagNameOrDome: string | Element,
    private props: Record<keyof any, any>,
    private children: any[]
  ) {
    this.source.once('unmount', () => this.dispose());

    this.initializeNode();
  }

  dispose() {
    cheapRemoveElem(this.node);
    (<any>this.node)[symbols.DISPOSE] = undefined;
  }

  private initializeNode() {
    if (this.node) return this.node;

    this.node =
      this.tagNameOrDome instanceof Element
        ? this.tagNameOrDome
        : document.createElement(this.tagNameOrDome);

    this.update(this.props, this.children);

    return this.node;
  }

  private update(props: Record<keyof any, any>, children: any[]) {
    this.props = props;
    this.children = children;

    pauseTracking();
    this.hydrateChildren();
    resetTracking();

    for (const [key, value] of Object.entries(this.props)) {
      this.hydrateAttribute(key, value);
    }

    (<any>this.node)[symbols.DISPOSE] = () => this.source.emit('unmount');
  }

  private isValidAttributeName(key: string) {
    return /^[a-zA-Z][\w-]*$/.test(key);
  }

  private hydrateAttribute(key: string, value: any) {
    // TODO attribute hooks
    if (
      key.startsWith('_') ||
      key.startsWith('$') ||
      !this.isValidAttributeName(key)
    ) {
      return;
    }

    switch (key) {
      case 'ref': {
        if (typeof value === 'function') {
          value(this.node);
        } else if (isRef(value)) {
          value.value = this.node;
        }
        return;
      }
      case 'effect': {
        if (typeof value === 'function') {
          this.source.effect(() => value(this.node), { lazy: false });
        }
        return;
      }
      default: {
        break;
      }
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const evKey = key.slice(2).toLowerCase();

      const old_cb = this.listeners[key];
      old_cb && this.node.removeEventListener(evKey, old_cb);
      this.listeners[key] = value;

      this.node.addEventListener(evKey, value);
      return;
    }
    const setAttribute = (val: any) => {
      if (key === 'value') {
        (<any>this.node).value = val;
        return;
      }
      if (key === 'defaultValue') {
        if ((<any>this.node).value) {
          return;
        }
        (<any>this.node).value = val;
        return;
      }
      if (typeof val === 'boolean') {
        if (val) {
          this.node.setAttribute(key, '');
        } else {
          this.node.removeAttribute(key);
        }
        return;
      }
      this.node.setAttribute(key, val);
    };
    if (isRef(value)) {
      this.source.effect(
        () => {
          const val = unref(value);
          setAttribute(val);
        },
        { lazy: false }
      );
    } else {
      setAttribute(value);
    }
  }

  private hydrateChildren() {
    const { children } = this;

    for (const child of children) {
      if (child === null || child === undefined) {
        continue;
      }
      const warpChild = ReactiveElement.warp(child);
      if (warpChild) {
        this.node.appendChild(warpChild);
      }
    }
  }
}
