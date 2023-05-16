export type AnyRecord = Record<keyof any, any>;

export type ElementView =
  | Node
  | string
  | number
  | boolean
  | undefined
  | null
  | void;

export type ElementViewRender = () => ElementView;

export interface FunctionComponentDefine<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[]
> {
  (props: Props, state: any, children: ChildrenList): ElementViewRender;
}
export type FC<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[]
> = FunctionComponentDefine<Props, ChildrenList>;

export interface SetupComponentDefine<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends any = any
> {
  setup(props: Props, children: ChildrenList): State;
  render(props: Props, state: State, children: ChildrenList): ElementView;
}

export type ComponentDefine<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State = any
> =
  | FunctionComponentDefine<Props, ChildrenList>
  | SetupComponentDefine<Props, ChildrenList, State>;
