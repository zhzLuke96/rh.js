import {
  createEffect,
  markHasOutsideEffect,
  onUnmounted,
  rh,
} from '../core/core';
import { raw } from './raw';

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
  rh(() => {
    markHasOutsideEffect();

    const style = document.createElement('style');
    createEffect(() => {
      style.innerHTML = raw(strings, ...values);
    });
    onUnmounted(() => {
      style.parentElement?.removeChild(style);
    });
    return () => style;
  });
