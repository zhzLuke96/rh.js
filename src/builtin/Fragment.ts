import {
  onUnmount,
  setupEffect,
  useElementSource,
} from '../core/reactiveHydrate';
import { onDomMutation } from '../common/onDomMutation';
import { ReactiveElement } from '../core/ReactiveElement';
import { component } from '../core/component';

type FragmentChildren = Element | Comment;

/**
 * Fragment Component
 */
export const Fragment = component({
  setup(_, childrenOrChildrenRender: any, ...children: any[]) {
    const component_context = {
      anchor: document.createTextNode(''),
      children: [] as Array<FragmentChildren>,
      parentNode: null as null | HTMLElement,
    };

    const childrenRenderFunc = (
      (childrenFn: () => any[]) => () =>
        childrenFn()
          .map((child) => ReactiveElement.warp(child))
          .filter(Boolean)
    )(
      typeof childrenOrChildrenRender === 'function'
        ? childrenOrChildrenRender
        : () => [childrenOrChildrenRender, ...children]
    );

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

        if (!newOne && oldOne) {
          oldOne.remove();
        } else if (!oldOne && newOne) {
          parentNode.insertBefore(newOne, anchor);
        } else if (oldOne && newOne) {
          if (oldOne === newOne) {
            continue;
          }
          parentNode.replaceChild(newOne, oldOne);
        }
      }
      component_context.children = newChildren as any[];
    };

    const [effectRunner, stopEffect] = setupEffect(childrenRender);
    const disposeEvent = onDomMutation(
      component_context.anchor,
      (parent) => {
        component_context.parentNode = parent;
        // TIPS: Here instead of calling childrenRender directly but calling runner, it is to control the scope of tracking
        effectRunner();
      },
      'DOMNodeInserted'
    );
    const unmountEffect = () => {
      disposeEvent();
      stopEffect();
      component_context.anchor.remove();
      component_context.children.forEach((view) => view?.remove());
    };
    onUnmount(unmountEffect);

    useElementSource((es) => {
      es.__parent_source?.once('update_before', () => {
        component_context.children.forEach((view) => view?.remove());
        es.__parent_source?.once('update_after', () => {
          component_context.anchor.remove();
        });
      });
    });
    return component_context;
  },
  render(_, ctx) {
    return ctx.anchor;
  },
});
