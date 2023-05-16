import { symbols } from '../constants';
import { ElementSource } from './ElementSource';
import { AnyRecord, ComponentDefine } from './types';

const appendSourceCallback = (
  component: ComponentDefine<any, any, any>,
  fn?: (es: ElementSource) => any
) => {
  if (!fn) {
    return;
  }
  const old_cb = (<any>component)[symbols.CS_HOOK_CB];
  (<any>component)[symbols.CS_HOOK_CB] = (es: ElementSource) => {
    old_cb?.(es);
    fn(es);
  };
};

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
  let source: ElementSource | undefined = ElementSource.peek();
  while (source) {
    const context = source.__context;
    if (key in context) {
      return context[key];
    }
    source = source.__parent_source;
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
export function inject(key: keyof any, value: any) {
  const source: ElementSource | undefined = ElementSource.peek();
  if (!source?.__container_source) {
    throw new Error(`inject must be called inside contextify Component`);
  }
  source.__container_source.__context[key] = value;
}

/**
 * component
 *
 * a syntactic sugar
 */
export const component = <
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State = any
>(
  define: ComponentDefine<Props, ChildrenList, State>,
  sourceCallback?: (es: ElementSource) => any
) => {
  appendSourceCallback(define, sourceCallback);
  return define;
};
