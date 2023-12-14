import { getCurrentView } from "@rhjs/core";
import { ViewEvent } from "@rhjs/core";

export type EventOff = () => any;
export const onViewEvent = <Event extends keyof ViewEvent>(
  event: Event,
  fn: ViewEvent[Event],
  options?: {
    once?: boolean;
    shouldTrigger?: (...args: Parameters<ViewEvent[Event]>) => boolean;
  }
): EventOff => {
  const { once = false } = options || {};
  const view = getCurrentView();
  const handler = (...args: Parameters<ViewEvent[Event]>) => {
    if (options?.shouldTrigger?.(...args) === false) {
      return;
    }
    return (<any>fn)(...args);
  };
  view.events[once ? "once" : "on"](event, handler as any);
  return () => view.events.off(event, handler as any);
};
export const createOnEvent =
  <Event extends keyof ViewEvent>(
    event: Event,
    options?: {
      once?: boolean;
      shouldTrigger?: (...args: Parameters<ViewEvent[Event]>) => boolean;
    }
  ) =>
  (fn: ViewEvent[Event]) =>
    onViewEvent(event, fn, options);

export const onMounted = createOnEvent("mounted");
export const onBeforeMount = createOnEvent("mount_before");
export const onAfterMount = createOnEvent("mount_after");
export const onUnmounted = createOnEvent("unmounted");
export const onBeforeMove = createOnEvent("move_before");
export const onAfterMove = createOnEvent("move_after");
export const onBeforeUnmount = createOnEvent("unmount_before");
export const onAfterUnmount = createOnEvent("unmount_after");
export const onUpdated = createOnEvent("updated");
export const onBeforeUpdate = createOnEvent("update_before");
export const onAfterUpdate = createOnEvent("update_after");
export const onBeforePatch = createOnEvent("patch_before");
export const onAfterPatch = createOnEvent("patch_after");
export const onError = createOnEvent("error");
export const onCatch = createOnEvent("throw"); // component event

export const onRenderStop = createOnEvent("render_stop");
export const onRenderTracked = createOnEvent("render_tracked");
export const onRenderTriggered = createOnEvent("render_triggered");
export const onCleanup = (callback: () => any): EventOff => {
  const view = getCurrentView();
  if (view.zoneFlag === "render") {
    const eventOff = () => {
      view.events.off("update_before", handler);
      view.events.off("unmounted", handler);
    };
    const handler = () => {
      // only call once
      eventOff();
      callback();
    };
    view.events.once("update_before", handler);
    view.events.once("unmounted", handler);
    return eventOff;
  } else {
    view.events.once("unmounted", callback);
    return () => view.events.off("unmounted", callback);
  }
};
