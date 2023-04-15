import { hookEffect } from '../ComponentSource';
import { rh } from '../rh';

/**
 * reactivity html
 *
 * This is a very simple implementation and should not be used in production, just to demonstrate one possible usage
 */
export const rHtml = (
  strings: TemplateStringsArray,
  ...fns: Array<() => any>
) => {
  const randId = Math.random().toString(36).slice(2);
  const slots = fns.map((fn, idx) => ({ fn, flag: `_${randId}_${idx}_` }));
  const htmlContent = strings.reduce(
    (acc, cur, idx) => `${acc}${cur}${slots[idx]?.flag || ''}`,
    ''
  );
  const walk = (dom: any) => {
    if (dom instanceof HTMLElement) {
      const props = {} as any;
      for (let i = 0; i < dom.attributes.length; i++) {
        const attribute = dom.attributes[i];
        const slot = slots.find((x) => x.flag === attribute.value);
        if (slot) {
          props[attribute.name] = slot.fn;
          dom.removeAttribute(attribute.name);
        }
      }
      rh(dom, props);
      dom.childNodes.forEach(walk);
    }
    if (dom instanceof Text) {
      const slot = slots.find((x) => x.flag === dom.textContent?.trim());
      if (slot) {
        hookEffect(() => (dom.textContent = slot.fn()));
      }
    }
  };
  const dom = document.createElement('div');
  dom.innerHTML = htmlContent;
  walk(dom);
  return dom.children[0];
};
