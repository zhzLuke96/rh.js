import { isRef, Ref } from '@vue/reactivity';
import { hookEffect } from '../ComponentSource';

/**
 * reactivity text node
 */
export const rt = (
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
      hookEffect(() => (slotNode.textContent = slot()));
    } else if (isRef(slot)) {
      hookEffect(() => (slotNode.textContent = String(slot.value)));
    }
    ret.push(slotNode);
  }
  return ret;
};
export const rText = rt;
