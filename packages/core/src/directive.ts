import { DomView, View, getCurrentView } from './core';

export type DirectiveCleanup = () => any;
export type DirectiveCallback = (
  node: Node,
  value: any,
  view: DomView
) => void | DirectiveCleanup;
export type DirectiveDefine = {
  key: string;
  mounted?: DirectiveCallback;
  unmounted?: DirectiveCallback;
  updated?: DirectiveCallback;
};

export function enableDirective(directive: DirectiveDefine) {
  const sym = View.symbols.DIRECTIVES;
  const view = getCurrentView();
  let directives = view.getContextValue(sym);
  if (View.isNone(directives)) {
    directives = {};
  }
  directives[directive.key] = directive;
  view.setContextValue(sym, directives);
}

export function disableDirective(key: string) {
  const sym = View.symbols.DIRECTIVES;
  const view = getCurrentView();
  let directives = view.getContextValue(sym);
  if (View.isNone(directives)) {
    directives = {};
  }
  // overwrite directive that current layer
  directives[key] = { key };
  view.setContextValue(sym, directives);
}
