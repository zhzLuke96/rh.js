import { ElementSource } from './ElementSource';
import { FunctionComponent } from './FunctionComponent';
import { ReactiveDOM } from './ReactiveDOM';
import { SetupComponent } from './SetupComponent';
import {
  AnyRecord,
  ComponentDefine,
  FunctionComponentDefine,
  SetupComponentDefine,
} from './types';
import { symbols } from '../constants';
import { ComponentType } from './rh.types';

const getCachedComponent = (key?: string) => {
  if (!key) {
    return;
  }
  const parent_source = ElementSource.peek();
  const { __container_source } = parent_source;
  if (!__container_source) {
    return;
  }
  __container_source.__context[symbols.CACHE_NODES] ||= {};
  return __container_source.__context[symbols.CACHE_NODES][key];
};

const cacheComponent = (key: string | undefined, component: ComponentType) => {
  if (!key) {
    return;
  }
  const parent_source = ElementSource.peek();
  const { __container_source } = parent_source;
  if (!__container_source) {
    return;
  }
  __container_source.__context[symbols.CACHE_NODES] ||= {};
  __container_source.__context[symbols.CACHE_NODES][key] = component;
};

export const createComponent = (
  define: ComponentDefine<AnyRecord, any[], any>,
  props: Record<keyof any, any> = {},
  children: any[] = []
): ComponentType => {
  const { key } = props;
  delete props['key'];

  if (key) {
    props['__node_cached'] = true;
  }

  const cachedComponent = getCachedComponent(key);
  if (cachedComponent) {
    return cachedComponent;
  }

  if (typeof define === 'function') {
    const componentInstance = new FunctionComponent(define, props, children);
    cacheComponent(key, componentInstance);
    return componentInstance;
  }
  if (
    typeof define === 'object' &&
    typeof define.render === 'function' &&
    typeof define.setup === 'function'
  ) {
    const componentInstance = new SetupComponent(define, props, children);
    cacheComponent(key, componentInstance);
    return componentInstance;
  }
  throw new Error(
    `Valid define type [${typeof define}] is not supported for reactiveHydrate.`
  );
};

/**
 * A function that creates a component or DOM node from the provided arguments.
 *
 * @param type The type of the component or DOM node to create. It can be one of the following:
 * - A string representing a built-in element name, such as 'div' or 'span'.
 * - An `Element` instance representing a custom element.
 * - A `FunctionComponentDefine` function representing a functional component.
 * - A `SetupComponentDefine` object representing a setup component.
 * @param props An optional object containing the properties to assign to the created component or DOM node.
 * @param children A variable number of arguments representing the child components or nodes to populate the contents of the created component or DOM node.
 * @returns A `Node` object representing the created component or DOM node.
 */
export function reactiveHydrate<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State = any
>(
  type: string,
  props?: Props | null | undefined,
  ...children: ChildrenList
): Node;
export function reactiveHydrate<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State = any
>(
  type: Element,
  props?: Props | null | undefined,
  ...children: ChildrenList
): Node;
export function reactiveHydrate<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
>(
  type: SetupComponentDefine<Props, ChildrenList, State>,
  props?: Props | null | undefined,
  ...children: ChildrenList
): Node;
export function reactiveHydrate<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
>(
  type: FunctionComponentDefine<Props, ChildrenList, State>,
  props?: Props | null | undefined,
  ...children: ChildrenList
): Node;
export function reactiveHydrate<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
>(
  type: ComponentDefine<Props, ChildrenList, State>,
  props?: Props | null | undefined,
  ...children: ChildrenList
): Node;
export function reactiveHydrate(
  type: string | Element | FunctionComponentDefine | SetupComponentDefine,
  props?: AnyRecord | null | undefined,
  ...children: any[]
): Node {
  props ||= {};

  children = <any>(children?.flat() || children);
  if (typeof type === 'string' || type instanceof Element) {
    const dom = ReactiveDOM.createReactiveDOM(type, props, children);
    return dom.node;
  }
  const componentInstance = createComponent(type, props, children);
  componentInstance.ensureEffectRunner();
  return componentInstance.currentView;
}

/**
 * A function that creates a component or DOM node from the provided arguments.
 *
 * ``` ts
 *
 * const node = rh('div', null, rh('span', null, 'Hello world'));
 * console.log(node);
 * // <div><span>Hello world</span></div>
 *
 * ```
 */
export const rh = reactiveHydrate;
