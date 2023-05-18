import { isRef, pauseTracking, resetTracking, unref } from '@vue/reactivity';
import { ElementSource } from './ElementSource';
import { ReactiveElement } from './ReactiveElement';

// tag + props + children => ReactiveDOM
export class ReactiveDOM {
  node!: Element;
  source = new ElementSource(this);

  constructor(
    private tagNameOrDome: string | Element,
    private props: Record<keyof any, any>,
    private children: any[]
  ) {
    this.source.once('unmount', () => this.dispose());

    this.buildNode();
  }

  dispose() {
    this.node?.parentElement?.removeChild(this.node);
  }

  private buildNode() {
    if (this.node) return this.node;

    this.node =
      this.tagNameOrDome instanceof Element
        ? this.tagNameOrDome
        : document.createElement(this.tagNameOrDome);

    pauseTracking();
    this.hydrateChildren();
    resetTracking();

    for (const [key, value] of Object.entries(this.props)) {
      this.hydrateAttribute(key, value);
    }

    return this.node;
  }

  private isValidAttributeName(key: string) {
    return /^[a-zA-Z][\w-]*$/.test(key);
  }

  private hydrateAttribute(key: string, value: any) {
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
      const old_cb = (this.node as any)['__cb_' + key];
      old_cb && this.node.removeEventListener(evKey, old_cb);
      (this.node as any)['__cb_' + key] = value;
      this.node.addEventListener(evKey, value);
      return;
    }
    this.source.effect(
      () => {
        const val = unref(value);
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
      },
      { lazy: false }
    );
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
