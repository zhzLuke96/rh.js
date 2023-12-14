import { InlineRenderResult, getCurrentView, ref } from "@rhjs/core";
import { Component, InlineRender, rh, compile } from "@rhjs/core";
import { onCatch, onMounted, onUnmounted } from "@rhjs/hooks";

type PromiseState = "pending" | "fulfilled" | "rejected";

function isPromise(obj: any): obj is Promise<unknown> {
  return (
    obj !== null &&
    (typeof obj === "object" || typeof obj === "function") &&
    typeof obj.then === "function"
  );
}

export const Suspense = ({
  component,
  render,
  fallback: fallback_render,
  error: error_render,
}: {
  component?: Component;
  render?: InlineRender;
  fallback: InlineRender | InlineRenderResult;
  error?: InlineRender | InlineRenderResult;
}) => {
  const state = ref<PromiseState>("pending");

  const inner = compile(() => {
    onCatch(async (value) => {
      if (isPromise(value)) {
        state.value = "pending";
        value.then(() => (state.value = "fulfilled"));
        value.catch(() => (state.value = "rejected"));
      }
    });
    return () => (component ? rh(component) : render?.());
  });

  const container = document.createElement("div");
  inner.view.parentView = getCurrentView();
  onMounted(() => {
    // init and mount children (init children tree)
    inner.view.mount(container);
  });
  onUnmounted(() => {
    container.innerHTML = "";
    container.remove();
    inner.view.unmount();
  });

  const render_fallback = () =>
    typeof fallback_render === "function" ? fallback_render() : fallback_render;
  const render_rejected = () =>
    error_render
      ? typeof error_render === "function"
        ? error_render()
        : error_render
      : render_fallback();

  return () => {
    switch (state.value) {
      case "pending":
        return render_fallback();
      case "fulfilled":
        return inner.view.anchor;
      case "rejected":
        return render_rejected();
    }
  };
};
