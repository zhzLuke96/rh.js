import { isRef, Ref } from '@vue/reactivity';
import { setupEffect } from '../core/reactiveHydrate';

/**
 * reactivity text node
 */
export const text = (
  strings: TemplateStringsArray,
  ...slots: Array<(() => any) | Ref>
) => {
  const ret = [] as Text[];
  for (let idx = 0; idx < strings.length; idx++) {
    const text = strings[idx];
    ret.push(document.createTextNode(text));
    const slot = slots[idx];
    const slotNode = document.createTextNode('');
    if (typeof slot === 'function') {
      setupEffect(() => (slotNode.textContent = slot()));
    } else if (isRef(slot)) {
      setupEffect(() => (slotNode.textContent = String(slot.value)));
    }
    ret.push(slotNode);
  }
  return ret;
};
