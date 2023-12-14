import { unref } from "@rhjs/core";
import { createMemo } from "@rhjs/hooks";

const unrefFn = (val: any) => unref(typeof val === "function" ? val() : val);
/**
 * reactivity raw template literals
 *
 * can be used `Ref<string>` or `() => string` in slot
 */
export const raw = (strings: TemplateStringsArray, ...values: any[]) =>
  strings.reduce((output, string, index) => {
    output += string;
    if (index < values.length) {
      output += unrefFn(values[index]);
    }
    return output;
  }, "");

export const rawMemo = (strings: TemplateStringsArray, ...values: any[]) => {
  return createMemo(() => raw(strings, ...values));
};
