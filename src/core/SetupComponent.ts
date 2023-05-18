import { pauseTracking, resetTracking } from '@vue/reactivity';
import { symbols } from '../constants';
import { ElementSource } from './ElementSource';
import { ReactiveElement } from './ReactiveElement';
import { AnyRecord, SetupComponentDefine } from './types';

export class SetupComponent<
  Props extends AnyRecord,
  ChildrenList extends any[],
  State extends any
> extends ReactiveElement {
  get [symbols.IS_COMPONENT]() {
    return true;
  }

  state!: State;

  constructor(
    protected _define: SetupComponentDefine<Props, ChildrenList>,
    protected props: Props,
    protected children: ChildrenList
  ) {
    super();
  }

  protected initialize() {
    this.initializeComponent();
  }

  protected initializeComponent() {
    const node_cached = '__node_cached' in this.props;
    this.source = new ElementSource(this, node_cached);
    this.source.once('unmount', () => this.dispose());
    this.installSource();
    this.initializeSetup();
  }

  protected initializeSetup(): void {
    const { props, children } = this;
    pauseTracking();
    ElementSource.source_stack.push(this.source);
    this.source.emit('setup_before');
    this.state = this._define.setup(props, children);
    this.source.emit('setup_after');
    ElementSource.source_stack.pop();
    resetTracking();
  }

  render(): Node | null {
    const view = this._define.render(this.props, this.state, this.children);
    return ReactiveElement.warp(view);
  }

  protected installSource(): void {
    (<any>this._define)[symbols.CS_HOOK_CB]?.(this.source);
  }
}
