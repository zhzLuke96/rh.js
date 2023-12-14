import { FC, View, mount, compile, DomView, getCurrentView } from "@rhjs/core";
import { onMounted, onUnmounted } from "@rhjs/hooks";

/**
 * Portal Component
 */
export const Portal: FC<{
  node?: Node | string;
  [K: string]: any;
}> = ({ node, ...props }, state: any, children: any[]) => {
  const container_view = compile(node || "div", props);
  if (!(container_view instanceof DomView)) {
    throw new Error(
      `node must be a valid dom node or tagName, but got ${typeof node}`
    );
  }
  const container = container_view.elem;

  if (!container.parentNode) {
    onMounted(() => {
      mount(document.body, container, props);
    });
  }

  const currentView = getCurrentView();
  const portalView = new View();
  portalView.parentView = currentView;
  portalView.mount(container);

  onUnmounted(() => {
    portalView.unmount();
    container_view.unmount();
  });

  return (_1, _2, children) => {
    portalView.updateChildren(children);
    return null;
  };
};
