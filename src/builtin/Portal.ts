import { onUnmount } from '../ComponentSource';
import { rh } from '../rh';

/**
 * Portal Component
 */
export const Portal = (
  { container, ...props }: { container?: HTMLElement; [K: string]: any },
  ...children: any
) => {
  const marker = document.createTextNode('');

  const target_container: HTMLElement =
    container || document.createElement('div');
  document.body.appendChild(target_container);
  // same appendChild, but parse props
  rh(target_container, props, ...children);
  onUnmount(() => {
    target_container.parentElement?.removeChild(target_container);
  });

  return () => marker;
};
