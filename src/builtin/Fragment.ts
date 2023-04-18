import { hookEffect, source_stack } from '../ComponentSource';
import { onDomInserted } from '../misc';
import { rh, rhElem, warpView } from '../rh';

type FragmentChildren = Element | Comment;

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup(_, innerRender: () => Array<rhElem>) {
    const component_context = {
      anchor: document.createTextNode(''),
      children: [] as Array<FragmentChildren>,
      parentNode: null as null | HTMLElement,
    };
    const rerender = () => {
      // *must be called before all returns, because to register to the effect
      const newChildren = innerRender()
        .map((child) => warpView(child, source_stack.peek()))
        .filter(Boolean);

      const { children: oldChildren, anchor, parentNode } = component_context;
      if (!parentNode) {
        // wait anchor insert
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
      component_context.children = newChildren as Array<FragmentChildren>;
    };
    onDomInserted(component_context.anchor, (parent) => {
      component_context.parentNode = parent;
      rerender();
    });
    hookEffect(rerender);
    return component_context;
  },
  render(ctx) {
    return ctx.anchor;
  },
});
