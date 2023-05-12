import { symbols } from '../constants';
import { Stack } from '../misc';
import { SetupComponent, FunctionComponent, rh } from '../rh';

type RhComponent = FunctionComponent | SetupComponent;
type ContextObject = Record<string, any>;
const create_ctx = () => Object.create(null) as ContextObject;
const ctx_stack = new Stack<ContextObject>();

const global_context = create_ctx();
ctx_stack.push(global_context);

/**
 * Provides the value associated with the specified key in the current or parent contexts
 * @param key - the key to look up
 * @param default_value - the default value to return if the key is not found
 * @returns the value associated with the key, or the default value if the key is not found
 */
export function provide<T = unknown>(
  key: string,
  default_value: T = symbols.NONE as any
): T | undefined {
  const ctx_arr = ctx_stack.toArray().reverse();
  for (const ctx of ctx_arr) {
    if (key in ctx) {
      return ctx[key];
    }
  }
  if (default_value === symbols.NONE) {
    throw new Error(`The key '${key}' is not defined in context`);
  }
  return default_value;
}

/**
 * Injects a key-value pair into the current context.
 * @param key - the key to inject
 * @param value - the value to inject
 * @throws an error if called outside the contextify component
 */
export function inject(key: string, value: any) {
  const ctx_arr = ctx_stack.toArray();
  if (ctx_arr.length === 0) {
    throw new Error(`inject must be called inside contextify Component`);
  }
  const top = ctx_arr[ctx_arr.length - 1];
  top[key] = value;
}

/**
 * Applies context to a RhComponent, allowing it to access values from its parents' contexts.
 * @param component - the component to contextify
 * @returns the contextify component
 */
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
    cs.once('unmount', () => {
      // for gc
      component_context = null as any;
    });
  });
