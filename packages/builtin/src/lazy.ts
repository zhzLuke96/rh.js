import { ref, unref } from "@rhjs/core";
import { Component, rh, untrack, View } from "@rhjs/core";

const defaultSelector = (module: ModuleLike<Component>) => {
  if (!module?.default) {
    throw new Error(
      "Module has no default export. Please use a selector or export a default component."
    );
  }
  return module.default;
};

type ModuleLike<T> = { default: T };
export const lazy = <ComponentExport extends Component>(
  loader: () => Promise<ModuleLike<Component>>,
  selector?: (module: ModuleLike<Component>) => any
) => {
  let module: ModuleLike<Component> | null = null;
  let p: Promise<ModuleLike<Component>> | null = null;

  const exportSelector = selector || defaultSelector;

  const ensureModule = () =>
    p || (p = loader().then((result) => (module = result)));

  const fnComponent = ((props: any, ...children: any[]) => {
    const view = View.topView();
    const moduleRef = ref(module);
    if (!module) {
      const promise = ensureModule().then((module) => {
        if (untrack(moduleRef)) {
          return;
        }
        moduleRef.value = module;
      });
      view.events.emit("throw", promise);
    }
    return () => {
      const module = unref(moduleRef);
      if (!module) {
        return null;
      }
      return rh(exportSelector(module), props, ...children);
    };
  }) as unknown as ComponentExport;

  return fnComponent;
};
