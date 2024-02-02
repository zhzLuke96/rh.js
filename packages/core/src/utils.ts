import { isRef, unref } from '@rhjs/observable';

export const unSetAttribute = (dom: Element, name: string) => {
  switch (name) {
    case 'className':
    case 'class': {
      dom.removeAttribute('class');
      break;
    }
    case 'style': {
      if (!isStyleElement(dom)) {
        break;
      }
      dom.style.cssText = '';
      break;
    }
    default: {
      dom.removeAttribute(name);
      break;
    }
  }
};
export const unrefAttribute = (value: any): any => {
  if (typeof value === 'function') {
    return value();
  }
  if (isRef(value)) {
    return unref(value);
  }
  if (Array.isArray(value)) {
    return value.map(unrefAttribute);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, unrefAttribute(v)])
    );
  }
  return unref(value);
};
export const isStyleElement = (x: Element): x is HTMLElement =>
  x instanceof Element && typeof (<any>x)['style'] === 'object';
const is_boolean_value = (x: any) =>
  typeof x === 'boolean' ||
  (typeof x === 'string' &&
    (x === '' || x.toLowerCase() === 'true' || x.toLowerCase() === 'false'));
export const setAttribute = (dom: Element, name: string, value: any) => {
  switch (name) {
    case 'className':
    case 'class': {
      let className = '';
      if (Array.isArray(value)) {
        className = value.join(' ');
      } else if (typeof value === 'object') {
        className = Object.entries(value)
          .filter(([_, v]) => !!v)
          .map(([k]) => k)
          .join(' ');
      } else {
        className = String(value);
      }
      dom.setAttribute('class', className);
      break;
    }
    case 'style': {
      if (!isStyleElement(dom)) {
        break;
      }
      if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => ((dom.style as any)[k] = v));
      } else {
        dom.style.cssText = String(value);
      }
      break;
    }
    case 'value': {
      if ('value' in dom) {
        (dom as any).value = value;
      }
      dom.setAttribute(name, String(value));
      break;
    }
    default: {
      if (!is_boolean_value(value)) {
        dom.setAttribute(name, String(value));
        return;
      }
      const is_true =
        typeof value === 'boolean'
          ? value
          : typeof value === 'string'
          ? value.toLowerCase() !== 'false'
          : Boolean(value);
      if (is_true) dom.setAttribute(name, '');
      else if (dom.hasAttribute(name)) dom.removeAttribute(name);
      break;
    }
  }
};
