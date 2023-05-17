import {
  onUnmount,
  setupEffect,
  useElementSource,
} from '../core/reactiveHydrate';
import { onDomMutation } from '../common/onDomMutation';
import { ReactiveElement } from '../core/ReactiveElement';
import { component } from '../core/component';
import { ElementSource } from '../core/ElementSource';

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

    const [effectRunner, stopEffect] = setupEffect(() => {
      ElementSource.source_stack.push(fragmentES);
      childrenRender();
      ElementSource.source_stack.pop();
    });
    const disposeEvent1 = onDomMutation(
      component_context.anchor,
      (parent) => {
        component_context.parentNode = parent;
        // TIPS: Here instead of calling childrenRender directly but calling runner, it is to control the scope of tracking
        effectRunner();
      },
      'DOMNodeInserted'
    );
    const disposeEvent2 = onDomMutation(
      component_context.anchor,
      (parent) => {
        component_context.children.forEach((view) => view?.remove());
        component_context.parentNode = null;
      },
      'DOMNodeRemoved'
    );
    const unmountEffect = () => {
      disposeEvent1();
      disposeEvent2();
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
