import { ref } from "@rhjs/core";
import { Component, rh, untrack, View } from "@rhjs/core";

type ModuleLike<T> = { default: T };
export const lazy = <ComponentExport extends Component>(
  module_loader: () => Promise<ModuleLike<Component>>
) => {
  let module: ModuleLike<Component> | null = null;
  let p: Promise<ModuleLike<Component>> | null = null;

  const ensure_module = () =>
    p || (p = module_loader().then((result) => (module = result)));

  const fnComponent = ((props: any, ...children: any[]) => {
    const view = View.topView();
    const moduleRef = ref(module);
    if (!module) {
      const promise = ensure_module().then((module) => {
        if (untrack(moduleRef)) {
          return;
        }
        moduleRef.value = module;
      });
      view.events.emit("throw", promise);
    }
    return () =>
      moduleRef.value?.default
        ? rh(moduleRef.value.default, props, ...children)
        : null;
  }) as unknown as ComponentExport;

  return fnComponent;
};
