import { isRef, pauseTracking, resetTracking, unref } from '@vue/reactivity';
import { cheapRemoveElem } from '../common/cheapRemoveElem';
import { globalIdleScheduler } from '../common/IdleScheduler';
import { onDomMutation } from '../common/onDomMutation';
import { symbols } from '../constants';
import { ElementSource } from './ElementSource';
import { ReactiveElement } from './ReactiveElement';
import { AnyRecord } from './types';

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
    ReactiveDOM.instances.set(ins.elem, ins);
    return ins;
  }

  // custom directive
  static directives = new Map<
    string,
    (elem: Element, dom: ReactiveDOM) => any
  >();

  elem!: Element;
  source = new ElementSource(this);

  listeners = {} as Record<string, (...args: any[]) => any>;

  dispose_onDomInserted!: () => any;

  constructor(
    private tagNameOrDome: string | Element,
    private props: Record<keyof any, any>,
    private children: any[]
  ) {
    this.source.once('unmount', () => this.dispose());

    this.initializeNode();
  }

  dispose() {
    cheapRemoveElem(this.elem);
    (<any>this.elem)[symbols.DISPOSE] = undefined;
    this.dispose_onDomInserted?.();
  }

  private initializeNode() {
    if (this.elem) return this.elem;

    this.elem =
      this.tagNameOrDome instanceof Element
        ? this.tagNameOrDome
        : document.createElement(this.tagNameOrDome);

    this.update(this.props, this.children);

    this.dispose_onDomInserted = onDomMutation(
      this.elem,
      (parent, dom) => {
        this.dispose_onDomInserted?.();
        this.source.emit('mount');
      },
      'DOMNodeInserted'
    );

    return this.elem;
  }

  private update(props: AnyRecord, children: any[]) {
    this.props = props;
    this.children = children;

    this.source.bindDirectiveFromProps(props);

    this.source.emit('update_before');
    this.source.emit('update');

    try {
      pauseTracking();
      this.hydrateChildren();
      resetTracking();
      for (const [key, value] of Object.entries(this.props)) {
        this.hydrateAttribute(key, value);
      }
      (<any>this.elem)[symbols.DISPOSE] = () => this.source.emit('unmount');
    } catch (error) {
      this.source.throw(error);
      console.error(error);
    } finally {
      this.source.emit('update_after');
    }
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
          value(this.elem);
        } else if (isRef(value)) {
          value.value = this.elem;
        }
        return;
      }
      case 'effect': {
        if (typeof value === 'function') {
          this.source.effect(() => value(this.elem), { lazy: false });
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
      old_cb && this.elem.removeEventListener(evKey, old_cb);
      this.listeners[key] = value;

      this.elem.addEventListener(evKey, value);
      return;
    }
    const setAttribute = (val: any) => {
      if (key === 'value') {
        (<any>this.elem).value = val;
        return;
      }
      if (key === 'defaultValue') {
        if ((<any>this.elem).value) {
          return;
        }
        (<any>this.elem).value = val;
        return;
      }
      if (typeof val === 'boolean') {
        if (val) {
          this.elem.setAttribute(key, '');
        } else {
          this.elem.removeAttribute(key);
        }
        return;
      }
      this.elem.setAttribute(key, val);
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

    // just append
    children
      .filter((x) => x !== null && x !== undefined)
      .map((child) => ReactiveElement.warp(child))
      .filter(Boolean)
      .forEach((child) => this.elem.appendChild(child!));

    // by fragment
    // FIXME: cant fire inserted event...
    // const fragment = document.createDocumentFragment();
    // children
    //   .filter((x) => x !== null && x !== undefined)
    //   .map((child) => ReactiveElement.warp(child))
    //   .filter(Boolean)
    //   .forEach((child) => fragment.appendChild(child!));
    // this.node.appendChild(fragment);
  }
}
