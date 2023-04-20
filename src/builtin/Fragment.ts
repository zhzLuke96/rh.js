import { hookEffect, onUnmount, source_stack, useCS } from '../ComponentSource';
import { onDomInserted } from '../misc';
import { rh, warpView } from '../rh';

type FragmentChildren = Element | Comment;

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup(_, childrenOrChildrenRender: any, ...children: any[]) {
    const component_context = {
      anchor: document.createTextNode(''),
      children: [] as Array<FragmentChildren>,
      parentNode: null as null | HTMLElement,
    };

    const cs = source_stack.peek();
    const childrenRenderFunc = (
      (childrenFn: () => any[]) => () =>
        childrenFn()
          .map((child) => warpView(child, cs))
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

    hookEffect(childrenRender);
    const disposeEvent = onDomInserted(component_context.anchor, (parent) => {
      component_context.parentNode = parent;
      childrenRender();
    });
    onUnmount(disposeEvent);

    useCS((cs) => {
      cs.__parent_source?.once('update_before', () => {
        component_context.children.forEach((view) => view?.remove());
        cs.__parent_source?.once('update_after', () => {
          component_context.anchor.remove();
        });
      });
    });
    return component_context;
  },
  render(ctx) {
    return ctx.anchor;
  },
});
