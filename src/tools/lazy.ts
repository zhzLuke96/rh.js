import { ref } from '@vue/reactivity';
import { FunctionComponent, SetupComponent, rh } from '../rh';

type ModuleLike<T> = { default: T };
type RhComponent = FunctionComponent | SetupComponent;
export const lazy = <Component extends RhComponent>(
  module_loader: () => Promise<ModuleLike<RhComponent>>
) => {
  let module: ModuleLike<RhComponent> | null = null;
  let p: Promise<ModuleLike<RhComponent>> | null = null;

  const ensure_module = () =>
    p || (p = module_loader().then((result) => (module = result)));

  const fnComponent = ((props: any, ...children: any[]) => {
    const moduleRef = ref(module);
    if (!module) {
      ensure_module().then((module) => {
        moduleRef.value = module;
        console.log(module);
      });
    }
    return () =>
      moduleRef.value ? rh(moduleRef.value.default, props, ...children) : null;
  }) as unknown as Component;

  return fnComponent;
};
