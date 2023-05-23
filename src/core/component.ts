import { symbols } from '../constants';
import { ElementSource } from './ElementSource';
import {
  AnyRecord,
  ComponentDefine,
  FunctionComponentDefine,
  SetupComponentDefine,
} from './types';

const appendCreateCallback = (
  component: ComponentDefine<any, any, any>,
  fn?: (es: ElementSource) => any
) => {
  if (!fn) {
    return;
  }
  const old_cb = (<any>component)[symbols.ES_CREATE_CB];
  (<any>component)[symbols.ES_CREATE_CB] = (es: ElementSource) => {
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
  const source: ElementSource | undefined = ElementSource.peek();
  if (!source) {
    throw new Error('No element source found');
  }
  return source.getContextValue(key, {
    default_value,
  });
}

/**
 * Injects a key-value pair into the current context.
 * @param key - the key to inject
 * @param value - the value to inject
 * @throws an error if called outside component
 */
export function inject(key: keyof any, value: any) {
  const source: ElementSource | undefined = ElementSource.peek();
  if (!source?.__container_source) {
    throw new Error(`inject must be called inside Component`);
  }
  source.setContextValue(key, value, { hit_container: true });
}

/**
 * A function that helps to infer the type of a component and optionally injects a callback function into the component's source when it is created.
 * @param define - the component definition object or function
 * @param onCreateCallback - an optional callback function that receives the component's source as an argument when the component is created
 * @returns the same component definition object or function as the input
 */
export function component<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
>(
  define: FunctionComponentDefine<Props, ChildrenList, State>,
  onCreateCallback?: (es: ElementSource) => any
): FunctionComponentDefine<Props, ChildrenList, State>;
export function component<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
>(
  define: SetupComponentDefine<Props, ChildrenList, State>,
  onCreateCallback?: (es: ElementSource) => any
): SetupComponentDefine<Props, ChildrenList, State>;
export function component<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
>(
  define: ComponentDefine<Props, ChildrenList, State>,
  onCreateCallback?: (es: ElementSource) => any
): ComponentDefine<Props, ChildrenList, State> {
  appendCreateCallback(define, onCreateCallback);
  return define;
}
