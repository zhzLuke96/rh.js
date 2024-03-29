import { isRef, Ref, unref, rh } from "@rhjs/core";
import { createEffect } from "@rhjs/hooks";

/**
 * reactivity text node
 */
export const text = (
  strings: TemplateStringsArray,
  ...slots: Array<(() => any) | Ref>
) =>
  rh(() => () => {
    const ret = [] as Text[];
    for (let idx = 0; idx < strings.length; idx++) {
      const text = strings[idx];
      ret.push(document.createTextNode(text));
      const slot = slots[idx];
      const slotNode = document.createTextNode("");
      if (typeof slot === "function") {
        createEffect(() => (slotNode.textContent = slot()));
      } else if (isRef(slot)) {
        createEffect(() => (slotNode.textContent = String(unref(slot))));
      } else if (slot !== undefined && slot !== null) {
        slotNode.textContent = String(slot);
      }
      ret.push(slotNode);
    }
    return ret;
  });
