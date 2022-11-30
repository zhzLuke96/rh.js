import { rh } from '../rh';

/**
 * Portal Component
 */
export const Portal = (
  {
    container: useContainer,
    ...props
  }: { container?: HTMLElement; [K: string]: any },
  ...children: any
) => {
  const marker = document.createTextNode('');

  const container: HTMLElement = useContainer || document.createElement('div');
  if (!useContainer) {
    document.body.appendChild(container);
  }
  // same appendChild, but parse props
  rh(container, props, ...children);

  marker.addEventListener('cleanup', () => {
    container.parentElement?.removeChild(container);
  });
  container.addEventListener('rh-err', (ev: any) => {
    marker.dispatchEvent(
      new CustomEvent('rh-err', {
        detail: ev.detail,
        bubbles: true,
        composed: false,
      })
    );
    ev.stopPropagation();
  });

  return () => marker;
};
