import { ref } from '@vue/reactivity';
import { ComponentDefine } from '../core/types';
import { rh } from '../core/reactiveHydrate';
import { untrack, useElementSource } from '../core/hooks';

type ModuleLike<T> = { default: T };
export const lazy = <Component extends ComponentDefine>(
  module_loader: () => Promise<ModuleLike<ComponentDefine>>
) => {
  let module: ModuleLike<ComponentDefine> | null = null;
  let p: Promise<ModuleLike<ComponentDefine>> | null = null;

  const ensure_module = () =>
    p || (p = module_loader().then((result) => (module = result)));

  const fnComponent = ((props: any, ...children: any[]) => {
    const es = useElementSource();
    const moduleRef = ref(module);
    if (!module) {
      const promise = ensure_module().then((module) => {
        if (untrack(moduleRef)) {
          return;
        }
        moduleRef.value = module;
      });
      es.emit('throw', promise);
    }
    return () =>
      moduleRef.value ? rh(moduleRef.value.default, props, ...children) : null;
  }) as unknown as Component;

  return fnComponent;
};
