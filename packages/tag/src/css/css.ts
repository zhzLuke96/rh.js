import { createEffect, markHasOutsideEffect, rh } from "@rhjs/core";
import { raw } from "../raw";

export const css = (strings: TemplateStringsArray, ...values: any[]) =>
  rh(() => {
    markHasOutsideEffect();

    const style = document.createElement("style");
    createEffect(() => {
      style.innerHTML = raw(strings, ...values);
    });
    return () => style;
  });
