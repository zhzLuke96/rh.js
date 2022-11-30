import { rh } from '../rh';

/**
 * Error Boundary
 */
export const ErrorBoundary = rh.component({
  setup({
    tagName = 'div',
    fallback,
    onError,
    ...props
  }: {
    tagName?: string;
    fallback?: Element;
    onError?: (error: Error) => void;
    [K: string]: any;
  }) {
    const container = document.createElement(tagName);
    const fallbackNode = fallback || document.createTextNode('');
    container.addEventListener('rh-err', (ev: any) => {
      onError?.(ev.detail);
      container.innerHTML = '';
      container.appendChild(fallbackNode);
    });
    return {
      container,
      props,
    };
  },
  render({ props, container }, ...children) {
    return rh(container, props, ...children);
  },
});
