import { computed, unref } from '@vue/reactivity';
import { onUnmount } from '../core/reactiveHydrate';

const unrefFn = (val: any) => unref(typeof val === 'function' ? val() : val);
/**
 * reactivity raw template literals
 *
 * can be used `Ref<string>` or `() => string` in slot
 */
export const raw = (strings: string[], ...values: any[]) =>
  strings.reduce((output, string, index) => {
    output += string;
    if (index < values.length) {
      output += unrefFn(values[index]);
    }
    return output;
  }, '');

export const rawRef = (strings: string[], ...values: any[]) => {
  const ref = computed(() => raw(strings, ...values));
  onUnmount(() => ref.effect.stop());
  return ref;
};