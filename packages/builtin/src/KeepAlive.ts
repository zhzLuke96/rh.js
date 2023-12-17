import { FC, View, markHasOutsideEffect } from "@rhjs/core";
import { onMounted, onUnmounted } from "@rhjs/hooks";

const KeepAliveMaps = new WeakMap<
  View,
  {
    [key: string]: View;
  }
>();
const getContainerView = (view: View) => {
  let currentView = view;
  while (!currentView.parentView.is_container) {
    currentView = currentView.parentView;
  }
  return currentView.parentView;
};
const ensureInnerView = (currentView: View, key: string, children: any) => {
  const containerView = getContainerView(currentView);
  if (!KeepAliveMaps.has(containerView)) {
    KeepAliveMaps.set(containerView, {});
  }
  const map = KeepAliveMaps.get(containerView)!;
  if (!map[key]) {
    const innerView = new View();
    containerView.events.once("unmounted", () => {
      innerView.unmount();
    });
    innerView.updateChildren(children);
    map[key] = innerView;
  } else {
    map[key].updateChildren(children);
  }
  return map[key];
};

export const KeepAlive: FC<{
  key: string;
}> = ({ key }, state, children) => {
  markHasOutsideEffect();

  const currentView = View.topView();
  const innerView = ensureInnerView(currentView, key, children);

  onMounted((parentElement) => {
    innerView.mount(parentElement, currentView.anchor, true);
  });
  onUnmounted(() => {
    innerView.remove();
  });

  // NOTE: innerView 不能直接输出，因为直接输出就会和外部的 view 产生关联导致提前unmount
  return () => null;
};
