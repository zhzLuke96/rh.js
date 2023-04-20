import { source_stack } from '../ComponentSource';
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
      if (!parentNode) {
        // wait anchor insert
        return;
      }
      for (const view of children_views) {
        if (view) {
          parentNode.insertBefore(view, anchor);
        }
      }
    });
    return { anchor };
  },
  render(ctx) {
    return ctx.anchor;
  },
});
