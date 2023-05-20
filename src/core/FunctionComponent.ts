import { symbols } from '../constants';
import { SetupComponent } from './SetupComponent';
import { AnyRecord, FunctionComponentDefine } from './types';

export class FunctionComponent<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
> extends SetupComponent<Props, ChildrenList, State> {
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
    (<any>_define)[symbols.ES_CREATE_CB] = (<any>_function_define)[
      symbols.ES_CREATE_CB
    ];

    super(_define, props, children);
  }
}
