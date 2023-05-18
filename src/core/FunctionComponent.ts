import { symbols } from '../constants';
import { SetupComponent } from './SetupComponent';
import { FunctionComponentDefine } from './types';

export class FunctionComponent<
  Props extends Record<keyof any, any>,
  ChildrenList extends any[] = any[]
> extends SetupComponent<Props, ChildrenList, unknown> {
  constructor(
    protected _function_define: FunctionComponentDefine<Props, ChildrenList>,
    props: Props,
    children: ChildrenList
  ) {
    const _define = {
      setup: (props: Props, children: ChildrenList) => {
        const state = {};
        _define.render = _function_define(props, state, children) as any;
        return state;
      },
      render: () => void 0,
    };
    (<any>_define)[symbols.CS_HOOK_CB] = (<any>_function_define)[
      symbols.CS_HOOK_CB
    ];

    super(_define, props, children);
  }
}
