import { reactive, DirectiveDefine } from "@rhjs/core";
import { shallowEqual } from "../internal/shallowEqual";
import { createEffect, onMounted, onUnmounted } from "@rhjs/hooks";

type DOMState = {
  active: boolean;
  checked: boolean;
  disabled: boolean;
  focus: boolean;
  hover: boolean;
  invalid: boolean;
  valid: boolean;
};

type StyleFunction = (state: DOMState) => Partial<CSSStyleDeclaration>;

const events = [
  "mousemove",
  "keypress",
  "keyup",
  "mousedown",
  "mouseup",
  "focus",
  "blur",
  "change",
];
const createDOMState = (dom: HTMLElement) => {
  const state = reactive({
    hover: false,
    active: false,
    focus: false,
    checked: false,
    disabled: false,
    invalid: false,
    valid: false,
  } as DOMState);
  const update = () => {
    for (const [k, v] of Object.entries(state)) {
      const value = dom.matches(`:${k}`);
      if (v === value) {
        continue;
      }
      (state as any)[k] = value;
    }
  };
  onMounted(() => {
    events.forEach((ev) => {
      dom.addEventListener(ev, update, { passive: true });
    });
  });
  onUnmounted(() => {
    events.forEach((ev) => {
      dom.removeEventListener(ev, update);
    });
  });
  update();
  return state;
};

export const styleDirective: DirectiveDefine = {
  key: "$style",
  mounted: (dom, value: StyleFunction) => {
    if (typeof value !== "function" || !(dom instanceof HTMLElement)) {
      return;
    }
    const state = createDOMState(dom);
    let currentStyle = {};
    const { cleanup } = createEffect(() => {
      const nextStyle = value(state);
      if (shallowEqual(currentStyle, nextStyle)) {
        return;
      }
      for (const [k] of Object.entries(currentStyle)) {
        // reset
        (dom as any).style[k] = "";
      }
      for (const [k, v] of Object.entries(nextStyle)) {
        (dom as any).style[k] = v;
      }
      currentStyle = nextStyle;
    });
    return cleanup;
  },
};
