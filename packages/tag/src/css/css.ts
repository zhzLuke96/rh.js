import { markHasOutsideEffect, rh } from "@rhjs/core";
import { createEffect } from "@rhjs/hooks";
import { raw } from "../raw";
import { cssMinifier } from "./minify";

const id = <T>(x: T) => x;

const cssBase =
  (processor: (css: string) => string) =>
  (strings: TemplateStringsArray, ...values: any[]) =>
    rh(() => {
      markHasOutsideEffect();

      const style = document.createElement("style");
      createEffect(() => {
        const css_text = raw(strings, ...values);
        style.innerHTML = processor(css_text);
      });
      return () => style;
    });

const css_id = cssBase(id);
const css_minify = cssBase(cssMinifier);

export const css = css_id as typeof css_id & {
  minify: typeof css_minify;
};
css.minify = css_minify;
