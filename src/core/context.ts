import { View } from './core';

const createContextProxy = (view: View) =>
  new Proxy({} as Record<keyof any, any>, {
    get(_, p, receiver) {
      const value = view.getContextValue(p);
      if (View.isNone(value)) return undefined;
      return value;
    },
    set(_, p, newValue, receiver) {
      view.setContextValue(p, newValue);
      return true;
    },
  });

type ContextProxy = Record<keyof any, any>;
type UseContextProxy = {
  (callback?: (context: ContextProxy) => any): ContextProxy;
  (): ContextProxy;
};

export const useContextProxy: UseContextProxy = (callback?: any) => {
  const view = View.topView();
  const context = createContextProxy(view);
  callback?.(context);
  return context;
};
