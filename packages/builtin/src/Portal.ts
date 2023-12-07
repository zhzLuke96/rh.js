import {
  FC,
  markHasOutsideEffect,
  onUnmounted,
  rh,
  View,
  weakMount,
} from "@rhjs/core";

/**
 * Portal Component
 */
export const Portal: FC<{
  node?: any;
  [K: string]: any;
}> = ({ node, ...props }, state: any, children: any[]) => {
  // 因为 Portal 如果需要patch，他是感知不到weakMount的，所以直接标记有副作用
  markHasOutsideEffect();

  const container: Element = node || document.createElement("div");

  const mount_on_self_container = !node;
  if (mount_on_self_container) {
    document.body.appendChild(container);
    onUnmounted(() => container.parentNode?.removeChild(container));
  }

  const anchor = weakMount(() => rh("div", props, ...children));
  const view = anchor && View.dom2view.get(anchor);
  if (view) {
    view.mount(container);
  }

  return () => null;
};
