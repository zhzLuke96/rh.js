import { onUnmount, setupEffect, useElementSource } from '../core/hooks';
import { onDomMutation } from '../common/onDomMutation';
import { ReactiveElement } from '../core/ReactiveElement';
import { component } from '../core/component';
import { ElementSource } from '../core/ElementSource';
import { cheapRemoveElem } from '../common/cheapRemoveElem';
import { symbols } from '../constants';
import { globalIdleScheduler } from '../common/IdleScheduler';

const arrayify = (obj: any) => (Array.isArray(obj) ? obj : [obj]);

type FragmentChildren = Element | Comment;

/**
 * Fragment Component
 */
export const Fragment = component({
  setup(_, [childrenOrChildrenRender, ...children]) {
    const component_context = {
      anchor: document.createTextNode(''),
      children: [] as Array<FragmentChildren>,
      parentNode: null as null | HTMLElement,
    };

    const fragmentES = useElementSource();

    const childrenRenderFunc = (
      (childrenFn: () => any[]) => () =>
        arrayify(childrenFn())
          .flat(1)
          .map((child) => ReactiveElement.warp(child))
          .filter(Boolean)
    )(
      typeof childrenOrChildrenRender === 'function'
        ? childrenOrChildrenRender
        : () => [childrenOrChildrenRender, ...children]
    );

    const disposeNode = (node: Node) => {
      const dispose = (<any>node)[symbols.DISPOSE];
      dispose?.();
    };

    const childrenRender = () => {
      const oldChildren = component_context.children;
      const newChildren = childrenRenderFunc();
      const { parentNode, anchor } = component_context;
      if (!parentNode) {
        return;
      }

      // simple diff based element object
      const length = Math.max(newChildren.length, oldChildren.length);
      for (let idx = 0; idx < length; idx++) {
        const newOne = newChildren[idx];
        const oldOne = oldChildren[idx];

        if (oldOne === newOne) {
          continue;
        }

        if (!newOne && oldOne) {
          // If you use cheapRemoveElem here, you may make an error during initialization
          // (Not now, because this branch will not be entered during initialization, but it is possible)
          // cheapRemoveElem(oldOne);
          oldOne.remove();
          disposeNode(oldOne);
        } else if (!oldOne && newOne) {
          parentNode.insertBefore(newOne, anchor);
        } else if (oldOne && newOne) {
          parentNode.replaceChild(newOne, oldOne);
          disposeNode(oldOne);
        }
      }
      component_context.children = newChildren as any[];
    };

    const [effectRunner, stopEffect] = setupEffect(
      () => {
        ElementSource.source_stack.push(fragmentES);
        childrenRender();
        ElementSource.source_stack.pop();
      },
      { lazy: true }
    );
    const disposeEvent1 = onDomMutation(
      component_context.anchor,
      (parent) => {
        component_context.parentNode = parent;
        globalIdleScheduler.runTask(() => {
          // TIPS: Here instead of calling childrenRender directly but calling runner, it is to control the scope of tracking
          effectRunner();
        });
      },
      'DOMNodeInserted'
    );
    const disposeEvent2 = onDomMutation(
      component_context.anchor,
      (parent) => {
        component_context.children.forEach(cheapRemoveElem);
        component_context.parentNode = null;
      },
      'DOMNodeRemoved'
    );
    const unmountEffect = () => {
      disposeEvent1();
      disposeEvent2();
      stopEffect();
      cheapRemoveElem(component_context.anchor);
      component_context.children.forEach(cheapRemoveElem);
    };
    onUnmount(unmountEffect);

    useElementSource((es) => {
      es.__parent_source?.once('update_before', () => {
        component_context.children.forEach(cheapRemoveElem);
        es.__parent_source?.once('update_after', () => {
          cheapRemoveElem(component_context.anchor);
        });
      });
    });
    return component_context;
  },
  render(_, ctx) {
    return ctx.anchor;
  },
});
