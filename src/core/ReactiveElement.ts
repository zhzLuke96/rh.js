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
  source!: ElementSource;

  viewAnchor = createAnchor();
  currentView = this.viewAnchor as Node;
  renderEffectRunner?: ReactiveEffectRunner;

  private dispose_onDomInserted?: () => any;

  protected _initialized = false;
  protected _initialize() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;
    this.initialize();
  }
  protected initialize() {
    this.source ||= new ElementSource(this);
    this.source.once('unmount', () => this.dispose());
  }

  ensureEffectRunner() {
    this._initialize();
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
    // Check if the current or parent component is unmounted. If so, dispose resources and return.
    // This prevents the update from being triggered after unmount due to dependency on some ref of the parent component.
    if (
      this.source.states.unmounted ||
      this.source.__parent_source.states.unmounted ||
      this.source.__container_source?.states.unmounted
    ) {
      this.dispose();
      return;
    }

    this.source.emit('update_before');
    try {
      ElementSource.source_stack.push(this.source);
      this.source.emit('update');
      this._update();
    } catch (error) {
      requestAnimationFrame(() => {
        // Throw the error in the next tick and emit an event to indicate the update failure
        // This avoids merging effects if the component receiving the error is the same as the current component
        this.source.emit('throw', error);
        console.error(error);
      });
    } finally {
      ElementSource.source_stack.pop();
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
