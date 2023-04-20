import { onUnmount, source_stack, useCS } from '../ComponentSource';
import { createAnchor } from '../misc';
import { rh, warpView } from '../rh';

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup(_, ...children: any[]) {
    const children_views = children
      .map((child) => warpView(child, source_stack.peek()))
      .filter(Boolean);
    const anchor = createAnchor((parentNode) => {
      children_views.forEach(
        (view) => view && parentNode.insertBefore(view, anchor)
      );
    });
    useCS((cs) => {
      cs.__parent_source?.once('update_before', () => {
        children_views.forEach((view) => view?.remove());
        cs.__parent_source?.once('update_after', () => {
          anchor.remove();
        });
      });
    });
    return { anchor };
  },
  render(ctx) {
    return ctx.anchor;
  },
});
