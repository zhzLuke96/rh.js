export const setAttribute = (
  element: HTMLElement,
  name: string,
  value: any
) => {
  if (name === 'className') {
    name = 'class';
  }
  if (name === 'class') {
    element.setAttribute(name, value);
  } else if (name === 'style') {
    if (typeof value === 'string') {
      element.setAttribute(name, value);
    } else {
      Object.entries(value).forEach(([k, v]) => {
        element.style[k as any] = v as any;
      });
    }
  } else if (name.startsWith('on')) {
    const event_name = name.slice(2).toLowerCase();
    element.addEventListener(event_name, value);
  } else {
    element.setAttribute(name, value);
  }
};
