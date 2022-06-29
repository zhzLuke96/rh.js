import {effect} from '@vue/reactivity';
import {rh} from './rh'

/**
 * reactivity text node
 */
export const rt = (strs: TemplateStringsArray, ...slots: Array<() => any>) => {
  const ret = [] as Text[];
  for (let idx = 0; idx < strs.length; idx++) {
    const text = strs[idx];
    ret.push(document.createTextNode(text));
    const slot = slots[idx];
    if (!slot || typeof slot !== 'function') {
      continue;
    }
    const slotNode = document.createTextNode('');
    effect(() => (slotNode.textContent = slot()));
    ret.push(slotNode);
  }
  return ret;
};

/**
 * reactivity html template
 */
export const rTpl = (
  htmlContent: string,
  propses = {} as Record<string, Record<string, any>>
) => {
  const dom = new DOMParser().parseFromString(htmlContent, 'text/html').body
    .children[0];
  for (const [sel, props] of Object.entries(propses)) {
    const elem = dom.querySelector(sel);
    if (elem) {
      rh.patch(elem as any, props);
    }
  }
  return dom;
};

/**
 * reactivity html
 */
export const rHtml = (
  strs: TemplateStringsArray, ...fns: Array<() => any>
) => {
  const randid = Math.random().toString(36).slice(2);
  const slots = fns.map((fn, idx) => ({fn, flag: `_${randid}_${idx}_`}));
  const htmlContent = strs.reduce((acc, cur, idx) => `${acc}${cur}${slots[idx]?.flag || ''}`,'');
  const walk = (dom: any) => {
    if (dom instanceof HTMLElement) {
      const props = {} as any;
      for (let i = 0; i < dom.attributes.length; i++) {
        const attribute = dom.attributes[i];
        const slot = slots.find(x => x.flag === attribute.value);
        if (slot) {
          props[attribute.name] = slot.fn;
        }
      }
      rh.patch(dom, props);
      dom.childNodes.forEach(walk);
    }
    if (dom instanceof Text) {
      const slot = slots.find(x => x.flag === dom.textContent?.trim());
      if (slot) {
        effect(() => dom.textContent = slot.fn());
      }
    }
  }
  const dom = document.createElement('div');
  dom.innerHTML = htmlContent;
  walk(dom);
  return dom.children[0];
}
