import { IHTMLView } from './types';
import { FragmentView, TextView } from './view';

const stringify = (value: any): string =>
  typeof value === 'string' || value instanceof String
    ? (value as string)
    : JSON.stringify(value);

const any2view = (value: any): IHTMLView => {
  if (typeof value === 'function') {
    return new ComponentView({}, value);
  }
  if (Array.isArray(value)) {
    return new FragmentView({
      children: value.map(any2view),
    });
  }
  const text = stringify(value);
  const text_view = new TextView(text);
  return text_view;
};

export type ComponentDefine = {
  render: (props: any, state: any) => any;
  setup?: (props: any) => any;
};

export class ComponentView extends FragmentView {
  state: Record<string, any> = {};

  render_effect?: any;

  constructor(props: any, readonly define: ComponentDefine) {
    super(props || {});

    const { setup } = define;
    this.state = setup?.(props) || {};

    this.type = define;
  }

  update(
    props?: Record<string, any> | undefined,
    children?: IHTMLView[] | undefined
  ): void {
    const next_view = this.define.render(
      {
        ...props,
        children,
      },
      this.state
    );
    const view_array = Array.isArray(next_view) ? next_view : [next_view];
    const next_children = view_array.map(any2view);

    super.update(props, next_children);
  }
}
