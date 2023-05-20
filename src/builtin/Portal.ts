import { rh } from '../core/reactiveHydrate';
import { onUnmount } from '../core/hooks';
import { FC } from '../core/types';

/**
 * Portal Component
 */
export const Portal: FC<{
  container?: HTMLElement;
  [K: string]: any;
}> = ({ container, ...props }, state: any, children: any[]) => {
  const target_container: HTMLElement =
    container || document.createElement('div');
  document.body.appendChild(target_container);
  // same appendChild, but parse props
  rh(target_container, props, ...children);
  onUnmount(() => {
    target_container.parentElement?.removeChild(target_container);
  });
  return () => null;
};
