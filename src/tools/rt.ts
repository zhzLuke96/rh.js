import { effect, isRef, Ref } from '@vue/reactivity';

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
      effect(() => (slotNode.textContent = slot()));
    } else if (isRef(slot)) {
      effect(() => (slotNode.textContent = String(slot.value)));
    }
    ret.push(slotNode);
  }
  return ret;
};
