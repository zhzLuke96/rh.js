import { onUnmount, source_stack } from '../ComponentSource';
import { onDomInserted } from '../misc';
import { rh, warpView } from '../rh';

/**
 * Fragment Component
 */
export const Fragment = rh.component({
  setup(_, ...children: any[]) {
    const anchor = document.createTextNode('');
    const children_views = children
      .map((child) => warpView(child, source_stack.peek()))
      .filter(Boolean);
    onDomInserted(anchor, (parentNode) => {
      children_views.forEach(
        (view) => view && parentNode.insertBefore(view, anchor)
      );
    });
    onUnmount(() => {
      children_views.forEach((view) => view?.remove());
      anchor.remove();
    });
    return { anchor };
  },
  render(ctx) {
    return ctx.anchor;
  },
});
