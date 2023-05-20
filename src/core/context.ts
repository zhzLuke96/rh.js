import { ElementSource } from './ElementSource';
import { useElementSource } from './hooks';

const createContextProxy = (es: ElementSource) =>
  new Proxy({} as Record<keyof any, any>, {
    get(_, p, receiver) {
      let layerES = es as ElementSource | undefined;
      while (layerES !== undefined) {
        const context = layerES.__context;
        if (p in context) {
          return context[p];
        }
        layerES = layerES.__parent_source;
      }
      return undefined;
    },
    set(_, p, newValue, receiver) {
      es.__context[p] = newValue;
      return true;
    },
  });

type ContextProxy = Record<keyof any, any>;
type UseContextProxy = {
  (callback?: (context: ContextProxy) => any): ContextProxy;
};

export const useContextProxy: UseContextProxy = (callback) => {
  const es = useElementSource();
  const context = createContextProxy(es);
  callback?.(context);
  return context;
};

export const useContainerContextProxy: UseContextProxy = (callback) => {
  const es = useElementSource();
  if (!es.__container_source) {
    throw new Error(
      `Container source not found, must be inside a container component to use element source`
    );
  }
  const context = createContextProxy(es.__container_source);
  callback?.(context);
  return context;
};
