import { HTMLViewProps, IHTMLView } from './types';
import { ViewPatch, diffView } from './diff';

class CommitQueue {
  constructor(readonly patches: ViewPatch[], readonly parent: IHTMLView) {}

  nextChildren() {
    const { patches } = this;
    const children = [...this.parent.children];

    for (const patch of patches) {
      switch (patch.type) {
        case 'insert': {
          const { new_index, new_value } = patch;
          children[new_index] = new_value;
          children.length = Math.max(new_index + 1, children.length);
          break;
        }
        case 'replace': {
          const { new_index, new_value } = patch;
          children[new_index] = new_value;
          break;
        }
        case 'move': {
          const { old_value, new_index } = patch;
          const old_index = children.indexOf(old_value);
          children[old_index] = null as any;
          children[new_index] = old_value;
          children.length = Math.max(new_index + 1, children.length);
          break;
        }
        case 'remove': {
          const { old_value } = patch;
          const old_index = children.indexOf(old_value);
          children[old_index] = null as any;
          break;
        }
      }
    }

    return children.filter(Boolean);
  }

  commit() {
    const { patches } = this;
    // move
    // const move_distance = (a: any) => Math.abs(a.old_index - a.new_index);
    patches
      .filter((p) => p.type === 'move')
      // .sort((a: any, b: any) => move_distance(b) - move_distance(a))
      .map(this.applyPatch.bind(this));
    // remove
    patches
      .filter((p) => p.type === 'remove')
      // .sort((a: any, b: any) => b.old_index - a.old_index)
      .map(this.applyPatch.bind(this));
    // insert
    patches
      .filter((p) => p.type === 'insert')
      // .sort((a: any, b: any) => a.new_index - b.new_index)
      .map(this.applyPatch.bind(this));
    // replace
    patches
      .filter((p) => p.type === 'replace')
      // .sort((a: any, b: any) => b.old_index - a.old_index)
      .map(this.applyPatch.bind(this));

    this.parent.children = this.parent.children.filter(Boolean);

    // patch
    patches.filter((p) => p.type === 'patch').map(this.applyPatch.bind(this));
    // prop
    patches.filter((p) => p.type === 'prop').map(this.applyPatch.bind(this));
  }

  applyPatch(patch: ViewPatch) {
    switch (patch.type) {
      case 'insert': {
        const { new_index, new_value, parent } = patch;
        parent.insert(new_value, new_index);
        break;
      }
      case 'replace': {
        const { new_index, new_value, parent } = patch;
        parent.replace(new_value, new_index);
        break;
      }
      case 'patch': {
        const { old_value, new_value } = patch;
        old_value.update(new_value.props, new_value.children);
        break;
      }
      case 'move': {
        const { old_value, new_index, parent } = patch;
        parent.move(old_value, new_index);
        break;
      }
      case 'remove': {
        const { old_value, parent } = patch;
        parent.remove(old_value);
        break;
      }
      default: {
        console.log('TODO', patch);
      }
    }
  }
}

export class HTMLView implements IHTMLView {
  static _index = 0;
  static next_index() {
    return HTMLView._index++;
  }

  type = '#view' as any;

  readonly _index = HTMLView.next_index();

  props: Record<string, any> = {};
  children: IHTMLView[] = [];

  parent?: IHTMLView;

  key?: any;

  constructor(props?: HTMLViewProps) {
    const { children = [], key, ...other_props } = props || {};
    this.props = other_props;
    this.key = key;
    this.children = children;
  }

  init() {
    this.children.forEach((child: any) => child.mount(this.element));
  }

  get element(): Node {
    throw new Error('need implements');
  }
  get anchor(): Node {
    throw new Error('need implements');
  }

  update(props?: IHTMLView['props'], children?: IHTMLView[]) {
    const patches = diffView(
      this.props,
      props,
      this.children,
      children || [],
      this
    );
    this.commit(patches);
  }

  _next_children = [] as IHTMLView[];
  commit(patches: ViewPatch[]) {
    const queue = new CommitQueue(patches, this);
    this._next_children = queue.nextChildren();
    queue.commit();
  }

  mount(container: Node, mount_before?: Node | null) {
    container.insertBefore(this.element, mount_before || null);
  }
  unmount(): void {
    for (const child of this.children) {
      child.unmount();
    }
  }

  getParentElement(): Node | null {
    return this.element;
  }

  nextSibling(index: number) {
    // index指向的就是自己的位置，所以要找下一个
    index += 1;
    let next_sibling = this._next_children[index];
    while (index < this._next_children.length) {
      next_sibling = this._next_children[index];
      if (next_sibling && this.children.includes(next_sibling)) {
        break;
      }
      index++;
    }
    if (next_sibling && this.children.includes(next_sibling)) {
      return next_sibling.anchor;
    }
    return null;
  }

  insert(value: IHTMLView, index: number): void {
    const parentElement = this.getParentElement();
    const next_sibling = this.nextSibling(index);
    if (parentElement) {
      parentElement.insertBefore(value.element, next_sibling || null);
    }
    value.parent = this;

    this.children.splice(index, 0, value);
  }
  remove(value: IHTMLView): void {
    const index = this.children.indexOf(value);
    if (index === -1) {
      throw new Error('wrong reomve');
    }
    const parentElement = this.getParentElement();
    parentElement?.removeChild(value.element);

    this.children.splice(index, 1);
  }
  replace(value: IHTMLView, index: number): void {
    const parentElement = this.getParentElement();
    const next_sibling = this.nextSibling(index);
    parentElement?.insertBefore(value.element, next_sibling || null);
    parentElement?.removeChild(this.children[index].element);
    value.parent = this;

    this.children.splice(index, 1, value);
  }

  move(value: IHTMLView, to: number): void {
    const from = this.children.indexOf(value);
    if (from === -1) {
      throw new Error('wrong move');
    }
    if (from === to) return;
    const parentElement = this.getParentElement();
    const next_sibling = this.nextSibling(to);
    parentElement?.insertBefore(value.element, next_sibling || null);
    value.parent = this;

    this.children.splice(to, 0, value);
    if (from > to) {
      this.children.splice(from + 1, 1);
    } else {
      this.children.splice(from, 1);
    }
  }
}

export class DomView extends HTMLView {
  _element: HTMLElement;
  constructor(readonly tagName: string, props?: any) {
    super(props);
    this.type = tagName;
    this._element = document.createElement(this.tagName);
    this.init();
  }

  get element(): Node {
    return this._element;
  }
  get anchor(): Node {
    return this._element;
  }

  unmount() {
    this._element.remove();
    super.unmount();
  }

  getParentElement(): Node {
    return this._element;
  }
}

export class TextView extends HTMLView {
  type = '#text';
  _element!: Text;
  constructor(text: string) {
    super({ text });
    this._element = document.createTextNode(text);
  }

  update(props?: Record<string, any> | undefined): void {
    const { text } = props || {};
    if (this._element.textContent === text) {
      return;
    }
    this._element.textContent = text;
  }

  get element(): Node {
    return this._element;
  }
  get anchor(): Node {
    return this._element;
  }
  unmount() {
    this._element.remove();
    super.unmount();
  }
}

export class FragmentView extends HTMLView {
  type = '#fragment' as any;
  _fragment = document.createDocumentFragment();
  _anchor = document.createTextNode('');

  constructor(props?: any) {
    super(props);

    (<any>this._anchor).__view = this;
    this.init();
  }

  get element(): Node {
    this._fragment.appendChild(this._anchor);
    for (const child of this.children) {
      child.mount(this._fragment);
    }
    return this._fragment;
  }

  get anchor(): Node {
    return this._anchor;
  }
  unmount() {
    this._anchor.remove();
    super.unmount();
  }

  nextSibling(index: number) {
    const next_sibling = super.nextSibling(index);
    if (index === 0 && !next_sibling) {
      return this._anchor;
    }
    return next_sibling;
  }

  getParentElement(): Node | null {
    return this._anchor.parentElement;
  }
}
