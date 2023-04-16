import { onUnmount } from '../ComponentSource';
import { rh } from '../rh';

/**
 * Portal Component
 */
export const Portal = (
  {
    container: target_container,
    ...props
  }: { container?: HTMLElement; [K: string]: any },
  ...children: any
) => {
  const marker = document.createTextNode('');

  const container: HTMLElement =
    target_container || document.createElement('div');
  document.body.appendChild(container);
  // same appendChild, but parse props
  rh(container, props, ...children);

  onUnmount(() => {
    container.parentElement?.removeChild(container);
  });

  return () => marker;
};
