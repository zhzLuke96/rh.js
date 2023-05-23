import {
  effect,
  isRef,
  ReactiveEffectRunner,
  Ref,
  unref,
} from '@vue/reactivity';
import { symbols } from '../constants';
import { onDomMutation } from '../common/onDomMutation';
import { ElementSource } from './ElementSource';
import { ElementViewRender } from './types';
import { cheapRemoveElem } from '../common/cheapRemoveElem';
import { globalIdleScheduler } from '../common/IdleScheduler';

const createAnchor = () => {
  const viewAnchor = document.createTextNode('');
  // const viewAnchor = document.createComment('anchor');
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

  rawTarget?: any; // for debugging

  private dispose_onDomInserted?: () => any;

  protected _initialized = false;
  protected _initialize() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;
    this.initialize();
    (<any>this.viewAnchor)[symbols.DISPOSE] = () => this.source.emit('unmount');
  }

  /**
   * only called when the element first rendered
   */
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

  // this is abstract function
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

    (<any>this.currentView)[symbols.DISPOSE] = () =>
      this.source.emit('unmount');
  }

  update(): void {
    // Check if the current or parent component is unmounted. If so, dispose resources and return.
    // This prevents the update from being triggered after unmount due to dependency on some ref of the parent component.
    if (
      this.source.states.unmounted ||
      this.source.__parent_source?.states.unmounted ||
      this.source.__container_source?.states.unmounted
    ) {
      this.source.emit('unmount');
      return;
    }

    this.source.emit('update_before');
    try {
      ElementSource.source_stack.push(this.source);
      this.source.emit('update');
      this._update();
    } catch (error) {
      this.source.throw(error);
      console.error(error);
    } finally {
      ElementSource.source_stack.pop();
      this.source.emit('update_after');
    }
  }

  dispose(): void {
    this.renderEffectRunner?.effect.stop();
    cheapRemoveElem(this.currentView);
    cheapRemoveElem(this.viewAnchor);
    (<any>this.currentView)[symbols.DISPOSE] = undefined;
    (<any>this.viewAnchor)[symbols.DISPOSE] = undefined;
    this.dispose_onDomInserted?.();
  }

  static fromRender(render: ElementViewRender) {
    const element = new ReactiveElement();
    element.render = () => ReactiveElement.warpView(render());
    element.rawTarget = render;
    return element;
  }

  static fromRef(viewRef: Ref<any>) {
    const element = new ReactiveElement();
    element.render = () => ReactiveElement.warpView(unref(viewRef));
    element.rawTarget = viewRef;
    return element;
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
    let element: ReactiveElement;
    if (typeof view === 'function') {
      element = ReactiveElement.fromRender(view);
    } else if (isRef(view)) {
      element = ReactiveElement.fromRef(view);
    } else {
      throw new Error('Unknown view type.');
    }
    element.ensureEffectRunner();
    return element.currentView;
  }
}
