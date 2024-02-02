import { HTMLViewProps, IHTMLView } from './types';

export type ViewPatch =
  | {
      type: 'prop';
      name: string;
      value: any;
      parent: IHTMLView;
      remove?: boolean;
    }
  | {
      type: 'insert';
      new_index: number;
      new_value: IHTMLView;
      parent: IHTMLView;
    }
  | {
      type: 'replace';
      old_index: number;
      new_index: number;
      old_value: IHTMLView;
      new_value: IHTMLView;
      parent: IHTMLView;
    }
  | {
      type: 'move';
      old_index: number;
      new_index: number;
      old_value: IHTMLView;
      new_value: IHTMLView;
      parent: IHTMLView;
    }
  | {
      type: 'remove';
      old_index: number;
      old_value: IHTMLView;
      parent: IHTMLView;
    }
  | {
      type: 'patch';
      old_index: number;
      new_index: number;
      old_value: IHTMLView;
      new_value: IHTMLView;
      parent: IHTMLView;
    };

const omit = <T extends object, K extends keyof T>(obj: T, ...keys: K[]) =>
  Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key as any)) {
      (acc as any)[key] = obj[key as K];
    }
    return acc;
  }, {} as Omit<T, K>);

const isNone = (x: any): x is undefined | null => x === undefined || x === null;
const isNotNone = (x: any): x is any => !isNone(x);
const isSameTypeView = (old_view?: IHTMLView, new_view?: IHTMLView) => {
  if (!old_view || !new_view) {
    return false;
  }
  const old_key = old_view.props.key;
  const new_key = new_view.props.key;
  if (isNotNone(old_key) && isNotNone(new_key)) {
    return old_key === new_key;
  }
  const old_type = old_view.type;
  const new_type = new_view.type;
  if (old_type === new_type) {
    return true;
  }
  return false;
};

export const diff = (
  old_view: IHTMLView,
  new_view: IHTMLView,
  parent: IHTMLView
) => {
  const is_same_type_view = isSameTypeView(old_view, new_view);
  if (!is_same_type_view) {
    return [
      {
        type: 'replace',
        new_index: 0,
        old_index: 0,
        old_value: old_view,
        new_value: new_view,
        parent,
      },
    ] as ViewPatch[];
  }

  const old_props = omit(old_view.props, 'children', 'key');
  const new_props = omit(new_view.props, 'children', 'key');

  const old_children = old_view.children || [];
  const new_children = new_view.children || [];

  return diffView(old_props, new_props, old_children, new_children, parent);
};

export const diffView = (
  old_props: any,
  new_props: any,
  old_children: IHTMLView[],
  new_children: IHTMLView[],
  parent: IHTMLView
) => {
  const patches: ViewPatch[] = [];

  const props_patches = diffProps(old_props, new_props, parent);
  patches.push(...props_patches);

  const children_patches = diffChildren(old_children, new_children, parent);
  patches.push(...children_patches);

  return patches;
};

export const diffProps = (
  old_props: HTMLViewProps,
  new_props: HTMLViewProps,
  parent: IHTMLView
) => {
  const patches: ViewPatch[] = [];

  const old_keys = Object.keys(old_props);
  const new_keys = Object.keys(new_props);

  const old_keys_set = new Set(old_keys);
  const new_keys_set = new Set(new_keys);

  const keys = new Set([...old_keys, ...new_keys]);

  Array.from(keys).forEach((key) => {
    if (old_keys_set.has(key) && !new_keys_set.has(key)) {
      patches.push({
        type: 'prop',
        name: key,
        remove: true,
        value: old_props[key],
        parent,
      });
    } else if (!old_keys_set.has(key) && new_keys_set.has(key)) {
      patches.push({
        type: 'prop',
        name: key,
        value: new_props[key],
        parent,
      });
    } else if (old_keys_set.has(key) && new_keys_set.has(key)) {
      if (old_props[key] !== new_props[key]) {
        patches.push({
          type: 'prop',
          name: key,
          value: new_props[key],
          parent,
        });
      }
    }
  });

  return patches;
};

type DiffView = {
  view: IHTMLView;
  index: number;
  keyed: boolean;
  key?: string;
  type: string;
};
// diff 之前预处理
export const prepareDiffChildren = (children: IHTMLView[]) =>
  children.map((view, index) => {
    const key = view.key;
    const type = view.type;
    return {
      view,
      index,
      keyed: isNotNone(key),
      key,
      type,
    } as DiffView;
  });

export const diffChildren = (
  old_children: IHTMLView[],
  new_children: IHTMLView[],
  parent: IHTMLView
) => {
  old_children = old_children.filter(Boolean);
  new_children = new_children.filter(Boolean);

  const patches: ViewPatch[] = [];

  const old_children_prepared = prepareDiffChildren(old_children);
  const new_children_prepared = prepareDiffChildren(new_children);

  // 先处理 keyed 的
  for (
    let old_index = 0;
    old_index < old_children_prepared.length;
    old_index++
  ) {
    const old_child = old_children_prepared[old_index];
    if (old_child.keyed === false) {
      continue;
    }
    const new_child = new_children_prepared.find(
      (child) => child.keyed && child.key === old_child.key
    );
    if (new_child) {
      patches.push({
        type: 'patch',
        new_index: new_child.index,
        old_index: old_child.index,
        new_value: new_child.view,
        old_value: old_child.view,
        parent,
      });
      if (old_child.index !== new_child.index) {
        patches.push({
          type: 'move',
          old_index: old_child.index,
          new_index: new_child.index,
          old_value: old_child.view,
          new_value: new_child.view,
          parent,
        });
      }
    } else {
      patches.push({
        type: 'remove',
        old_index: old_child.index,
        old_value: old_child.view,
        parent,
      });
    }
  }
  for (
    let new_index = 0;
    new_index < new_children_prepared.length;
    new_index++
  ) {
    const new_child = new_children_prepared[new_index];
    if (new_child.keyed === false) {
      continue;
    }
    const old_child = old_children_prepared.find(
      (child) => child.keyed && child.key === new_child.key
    );
    if (!old_child) {
      patches.push({
        type: 'insert',
        new_index: new_child.index,
        new_value: new_child.view,
        parent,
      });
    }
  }

  // 再处理没有 keyed 的
  let old_index = 0;
  let new_index = 0;

  while (
    old_index < old_children_prepared.length &&
    new_index < new_children_prepared.length
  ) {
    const old_child = old_children_prepared[old_index];
    const new_child = new_children_prepared[new_index];
    if (old_child.keyed) {
      old_index++;
      continue;
    }
    if (new_child.keyed) {
      new_index++;
      continue;
    }
    if (old_child.type === new_child.type) {
      patches.push({
        type: 'patch',
        new_index: new_child.index,
        old_index: old_child.index,
        new_value: new_child.view,
        old_value: old_child.view,
        parent,
      });
      if (old_child.index !== new_child.index) {
        patches.push({
          type: 'move',
          old_index: old_child.index,
          new_index: new_child.index,
          old_value: old_child.view,
          new_value: new_child.view,
          parent,
        });
      }
      old_index++;
      new_index++;
    } else {
      patches.push({
        type: 'replace',
        new_index: new_child.index,
        old_index: old_child.index,
        new_value: new_child.view,
        old_value: old_child.view,
        parent,
      });
      old_index++;
      new_index++;
    }
  }

  while (old_index < old_children_prepared.length) {
    const old_child = old_children_prepared[old_index];
    if (!old_child.keyed) {
      patches.push({
        type: 'remove',
        old_index: old_child.index,
        old_value: old_child.view,
        parent,
      });
    }
    old_index++;
  }

  while (new_index < new_children_prepared.length) {
    const new_child = new_children_prepared[new_index];
    if (!new_child.keyed) {
      patches.push({
        type: 'insert',
        new_index: new_child.index,
        new_value: new_child.view,
        parent,
      });
    }
    new_index++;
  }

  return patches;
};
