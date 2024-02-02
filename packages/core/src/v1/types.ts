export type IHTMLView = {
  type: any;

  element: Node;
  anchor: Node;

  props: Record<string, any>;
  children: IHTMLView[];

  key?: any;

  parent?: IHTMLView;

  update(props?: Record<string, any>, children?: IHTMLView[]): void;

  mount(container: Node, mount_before?: Node | null): void;
  unmount(): void;
  insert(value: IHTMLView, index: number): void;
  replace(value: IHTMLView, index: number): void;
  remove(value: IHTMLView): void;
  move(value: IHTMLView, to: number): void;
};

export type HTMLViewProps = {
  children?: IHTMLView[];
  [key: string]: any;
};
