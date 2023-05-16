import { effect, isRef, ReactiveEffectRunner, unref } from '@vue/reactivity';
import { symbols } from '../constants';
import { onDomMutation } from '../common/onDomMutation';
import { ElementSource } from './ElementSource';

const createAnchor = () => {
  const viewAnchor = document.createTextNode('');
  (<any>viewAnchor)[symbols.IS_ANCHOR] = true;
  return viewAnchor;
};
const isAnchor = (anchor: any) => !!(anchor && anchor[symbols.IS_ANCHOR]);

interface IReactiveElement {
  viewAnchor: Node;
  currentView: Node;
  renderEffectRunner?: ReactiveEffectRunner;
  render(): Node | null;
  update(): void;
  dispose(): void;
}

export class ReactiveElement implements IReactiveElement {
  source = new ElementSource(this);

  viewAnchor = createAnchor();
  currentView = this.viewAnchor as Node;
  renderEffectRunner?: ReactiveEffectRunner;

  private dispose_onDomInserted?: () => any;

  constructor() {
    this.initialize();
  }

  protected initialize() {
    this.source.once('unmount', () => this.dispose());
  }

  ensureEffectRunner() {
    if (this.renderEffectRunner) return this.renderEffectRunner;

    this.renderEffectRunner = effect(this.update.bind(this), {
      lazy: false,
    });

    this.dispose_onDomInserted = onDomMutation(
      this.currentView,
      (parent, dom) => {
        this.dispose_onDomInserted?.();
        this.source.emit('mount');

        // inject anchor
        if (this.viewAnchor !== dom) {
          parent.insertBefore(this.viewAnchor, dom);
        }
        if (dom !== this.currentView) {
          parent.insertBefore(this.currentView, dom);
          if (!isAnchor(dom)) {
            dom.parentElement?.removeChild(dom);
          }
        }
      },
      'DOMNodeInserted'
    );
    return this.renderEffectRunner;
  }

  render(): Node | null {
    return null;
  }

  private _update() {
    const oldView = this.currentView;
    const currentView = this.render() || this.viewAnchor;
    const parentElement = oldView?.parentElement;
    if (parentElement) {
      parentElement.replaceChild(currentView, oldView);
    }
    this.currentView = currentView;
  }

  update(): void {
    this.source.emit('update_before');
    try {
      ElementSource.source_stack.push(this.source);
      this.source.emit('update');
      this._update();
      ElementSource.source_stack.pop();
    } catch (error) {
      requestAnimationFrame(() => {
        // *If the component receiving throw is the component itself, it may cause the effect to be merged, so you need to throw at next-tick
        this.source.emit('throw', error);
        console.error(error);
      });
    } finally {
      this.source.emit('update_after');
    }
  }

  dispose(): void {
    this.renderEffectRunner?.effect.stop();
    this.currentView.parentElement?.removeChild(this.currentView);
    this.viewAnchor.parentElement?.removeChild(this.viewAnchor);
    this.dispose_onDomInserted?.();
  }

  static warpView(view: any): Node | null {
    if (view instanceof Node || view === null) {
      return view;
    }
    const text = document.createTextNode(`${view}`);
    return text;
  }

  static warp(view: any): Node | null {
    if (typeof view !== 'function' && !isRef(view)) {
      return ReactiveElement.warpView(view);
    }
    const element = new ReactiveElement();
    let viewRender: () => any;
    if (typeof view === 'function') {
      viewRender = view;
    } else if (isRef(view)) {
      viewRender = () => unref(view);
    } else {
      throw new Error('Unknown view type.');
    }
    element.render = () => ReactiveElement.warpView(viewRender());
    element.ensureEffectRunner();
    return element.currentView;
  }
}
