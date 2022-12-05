import { SetupComponent, FunctionComponent } from '../rh';

type RhComponent = FunctionComponent | SetupComponent;
const ctx_stack = [] as Record<string, any>[];

const create_ctx = () => Object.create(null) as Record<string, any>;
let current_ctx = create_ctx();

const setup_start = () => {
  ctx_stack.push(create_ctx());
};
const setup_end = () => {
  let layer_ctx = create_ctx();
  for (const ctx of ctx_stack) {
    layer_ctx = {
      ...layer_ctx,
      ...ctx,
    };
  }
  ctx_stack.pop();
  return layer_ctx;
};

export function provide<T>(key: string, default_value?: T): T | undefined {
  if (key in current_ctx) {
    return current_ctx[key];
  }
  for (let idx = ctx_stack.length - 1; idx > -1; idx--) {
    const ctx = ctx_stack[idx];
    if (key in ctx) {
      return ctx[key];
    }
  }
  return default_value;
}
export function inject(key: string, value: any) {
  if (ctx_stack.length === 0) {
    throw new Error(`inject must be called inside contextify Component`);
  }
  const top = ctx_stack[ctx_stack.length - 1];
  top[key] = value;
}

export function contextify<T extends RhComponent>(comp: T): T {
  if (typeof comp === 'function') {
    return ((...args: any[]) => {
      setup_start();
      const renderFn = comp(...args);
      const ctx = setup_end();
      return (...args: any[]) => {
        const prev_ctx = current_ctx;
        current_ctx = ctx;
        const ret = (renderFn as any)(...args);
        current_ctx = prev_ctx;
        return ret;
      };
    }) as T;
  } else if (typeof comp.setup === 'function') {
    let componentCtx = {} as any;
    return {
      ...comp,
      render(...args: any[]) {
        const prev_ctx = current_ctx;
        current_ctx = componentCtx;
        const ret = (comp.render as any)(...args);
        current_ctx = prev_ctx;
        return ret;
      },
      setup(...args: any[]) {
        setup_start();
        const ret = (comp.setup as any)(...args);
        componentCtx = setup_end();
        return ret;
      },
    } as T;
  }
  throw new Error(
    `component must be a function component or a setup component`
  );
}
