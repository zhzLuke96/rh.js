import { Stack } from '../misc';
import { SetupComponent, FunctionComponent, rh } from '../rh';

type RhComponent = FunctionComponent | SetupComponent;
type ContextObject = Record<string, any>;
const create_ctx = () => Object.create(null) as ContextObject;
const ctx_stack = new Stack<ContextObject>();

const global_context = create_ctx();
ctx_stack.push(global_context);

export function provide<T = unknown>(
  key: string,
  default_value?: T
): T | undefined {
  const current_ctx = ctx_stack.peek()!;
  if (key in current_ctx) {
    return current_ctx[key];
  }
  const ctx_arr = ctx_stack.toArray();
  for (let idx = ctx_arr.length - 1; idx > -1; idx--) {
    const ctx = ctx_arr[idx];
    if (key in ctx) {
      return ctx[key];
    }
  }
  return default_value;
}
export function inject(key: string, value: any) {
  const ctx_arr = ctx_stack.toArray();
  if (ctx_arr.length === 0) {
    throw new Error(`inject must be called inside contextify Component`);
  }
  const top = ctx_arr[ctx_arr.length - 1];
  top[key] = value;
}

export const contextify = <T extends RhComponent>(component: T): T =>
  rh.hookComponent(component, (cs) => {
    let component_context = create_ctx();
    cs.on('setup_before', () => {
      ctx_stack.push(component_context);
    });
    cs.on('setup_after', () => {
      for (const ctx of ctx_stack.toArray()) {
        component_context = {
          ...component_context,
          ...ctx,
        };
      }
      ctx_stack.pop();
    });
    cs.on('update_before', () => {
      ctx_stack.push(component_context);
    });
    cs.on('update_after', () => {
      ctx_stack.pop();
    });
  });
