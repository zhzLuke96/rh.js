import { rh } from '../rh';

/**
 * reactivity html template
 */
export const rTpl = (
  htmlContent: string,
  propsMap = {} as Record<string, Record<string, any>>
) => {
  const dom = new DOMParser().parseFromString(htmlContent, 'text/html').body
    .children[0];
  for (const [sel, props] of Object.entries(propsMap)) {
    const elem = dom.querySelector(sel);
    if (elem) {
      rh(elem, props);
    }
  }
  return dom;
};
