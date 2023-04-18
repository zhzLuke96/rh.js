import { unref } from '@vue/reactivity';

const unrefFn = (val: any) => (typeof val === 'function' ? val() : unref(val));
export const raw = (strings: string[], ...values: any[]) =>
  strings.reduce((output, string, index) => {
    output += string;
    if (index < values.length) {
      output += unrefFn(values[index]);
    }
    return output;
  }, '');
