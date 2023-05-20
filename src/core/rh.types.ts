import { FunctionComponent } from './FunctionComponent';
import { SetupComponent } from './SetupComponent';
import { AnyRecord } from './types';

export type ComponentType<
  Props extends AnyRecord = AnyRecord,
  ChildrenList extends any[] = any[],
  State extends AnyRecord = AnyRecord
> =
  | FunctionComponent<Props, ChildrenList>
  | SetupComponent<Props, ChildrenList, State>;
